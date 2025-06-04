/* ==========================================================================
   Массово одобрить с комментарием
   ========================================================================== */

const nodemailer = require("nodemailer");
const config = require("../../config");
const emailReplicaChangeStatus = require("../../emails/replicaChangeStatus");
const UsersInProject = require("../../models/users-in-project");
const checkToken = require("../../utils/token");
const getErrorData = require("../../utils/errors");
const Replica = require("../../models/replica");
const ReplicaMsg = require("../../models/replica-msg");
const statusesList = require("../../utils/statuses");
const addSearchContentForReplica = require("../../search/replica");
const addReplicaHistory = require("./utils/addReplicaHistory");
const replicaHistoryTypes = require("../../utils/replicaHistoryTypes");

const approveReplicaMany = async (req, res) => {
  const errors = [];
  const checkTokenResult = (await checkToken(req.body.token)) || {};

  if (checkTokenResult.status === "fail") {
    errors.push(checkTokenResult.errorText);
  }

  if (!req.body.ids || (req.body.ids && req.body.ids.length < 1)) {
    errors.push("Выберите реплики, чтобы одобрить их");
  } else {
    const replica = await Replica.find({
      _id: req.body.ids,
    });

    if (replica && replica.length) {
      const statusAll = [];
      let errorStatusEdit = false;

      for (const item of replica) {
        const status = item.status._id.toString();

        if (!status || (status && status !== statusesList.waiting)) {
          errorStatusEdit = true;
        }

        statusAll[status] = status;
      }

      if (Object.keys(statusAll).length !== 1) {
        errors.push(
          "Вы не можете изменить несколько реплик с разными статусами"
        );
      }

      if (errorStatusEdit) {
        errors.push(
          'Вы можете изменить реплики только со статусом "Ожидает согласования"'
        );
      }
    }
  }

  if (errors.length) {
    return res.json(getErrorData(errors));
  } else {
    const user = checkTokenResult.user;

    const replica = await Replica.find({
      _id: req.body.ids,
    });

    if (replica && replica.length) {
      let itemsWithChangedStatusCount = 0;

      for (const item of replica) {
        const replicaId = item._id.toString();
        const replicaStatus = item.status.toString();

        item.modifiedBy = user._id;
        item.modifiedDate = Date.now();
        item.status = statusesList.posting;

        if (replicaStatus !== item.status.toString()) {
          item.statusChange = Date.now();
          itemsWithChangedStatusCount += 1;

          await addReplicaHistory({
            id: item._id.toString(),
            userId: user._id.toString(),
            msg: null,
            msgOld: null,
            status: item.status,
            type: replicaHistoryTypes.changeStatus,
          });
        }

        await item.save();

        const replicaMsg = await ReplicaMsg.findOne({
          replica: replicaId,
          deleted: false,
        }).sort([["createdDate", -1]]);

        if (req.body.msg && replicaMsg) {
          replicaMsg.modifiedBy = user._id;
          replicaMsg.modifiedDate = Date.now();
          replicaMsg.status = statusesList.posting;
          replicaMsg.comment = req.body.msg;

          await replicaMsg.save();

          addSearchContentForReplica(replicaId);
        }
      }

      if (itemsWithChangedStatusCount) {
        // Отправляем письмо
        const transport = nodemailer.createTransport(config.SMTP_SETTINGS);

        const usersInProject = await UsersInProject.find({
          projectId: replica[0].project.toString(),
          deleted: false,
          active: true,
        })
          .select("userId projectId")
          .populate({
            path: "userId",
            select:
              "_id name lastName email deleted role notifyReplicaStatusChange",
            populate: {
              path: "role",
              select: "_id name accessLevel",
            },
          })
          .populate({
            path: "projectId",
            select: "_id name companyId",
            populate: {
              path: "companyId",
              select: "_id name",
            },
          });

        if (usersInProject) {
          for (const usersInProjectData of usersInProject) {
            if (
              usersInProjectData.userId &&
              !usersInProjectData.userId.deleted &&
              usersInProjectData.userId.role.accessLevel === 2 &&
              usersInProjectData.userId.notifyReplicaStatusChange
            ) {
              const emailOptions = {
                status: replica[0].status.toString(),
                email: usersInProjectData.userId.email,
                company: usersInProjectData.projectId.companyId.name,
                project: usersInProjectData.projectId.name,
                platform: replica[0].platform,
                msg: `Изменён статус ${itemsWithChangedStatusCount} реплик`,
              };

              await transport.sendMail(emailReplicaChangeStatus(emailOptions));
            }
          }
        }
      }
    }

    res.json({
      status: "success",
    });
  }
};

module.exports = approveReplicaMany;
