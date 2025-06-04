/* ==========================================================================
   Одобрить с комментарием
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

const approveReplica = async (req, res) => {
  const errors = [];
  const checkTokenResult = (await checkToken(req.body.token)) || {};

  if (checkTokenResult.status === "fail") {
    errors.push(checkTokenResult.errorText);
  }

  if (!req.params.replica) {
    errors.push("ID реплики не указан");
  } else if (req.params.replica.length !== 24) {
    errors.push("ID реплики указан неверно");
  }

  const replica = await Replica.findById(
    req.params.replica ? req.params.replica : null
  );

  if (!replica) {
    errors.push("Реплика не найдена");
  }

  if (errors.length) {
    return res.json(getErrorData(errors));
  } else {
    const user = checkTokenResult.user;
    const replicaStatus = replica.status.toString();

    replica.modifiedBy = user._id;
    replica.modifiedDate = Date.now();
    replica.status = statusesList.posting;

    if (replicaStatus !== replica.status.toString()) {
      replica.statusChange = Date.now();

      await addReplicaHistory({
        id: replica._id.toString(),
        userId: user._id.toString(),
        msg: null,
        msgOld: null,
        status: replica.status,
        type: replicaHistoryTypes.changeStatus,
      });

      // Отправляем письмо
      const transport = nodemailer.createTransport(config.SMTP_SETTINGS);

      const usersInProject = await UsersInProject.find({
        projectId: replica.project.toString(),
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
              status: replica.status.toString(),
              email: usersInProjectData.userId.email,
              company: usersInProjectData.projectId.companyId.name,
              project: usersInProjectData.projectId.name,
              platform: replica.platform,
              msg: `Изменён статус реплики`,
            };

            await transport.sendMail(emailReplicaChangeStatus(emailOptions));
          }
        }
      }
    }

    await replica.save();

    const replicaMsg = await ReplicaMsg.findOne({
      replica: req.params.replica,
      deleted: false,
    }).sort([["createdDate", -1]]);

    if (req.body.msg && replicaMsg) {
      replicaMsg.modifiedBy = user._id;
      replicaMsg.modifiedDate = Date.now();
      replicaMsg.status = statusesList.posting;
      replicaMsg.comment = req.body.msg;

      await replicaMsg.save();

      addSearchContentForReplica(req.params.replica);
    }

    res.json({
      status: "success",
      data: replica
    });
  }
};

module.exports = approveReplica;
