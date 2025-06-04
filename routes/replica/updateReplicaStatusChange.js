/* ==========================================================================
   Редактируем дату изменения статуса реплики
   ========================================================================== */

const checkToken = require("../../utils/token");
const getErrorData = require("../../utils/errors");
const Replica = require("../../models/replica");

const updateReplicaStatusChange = async (req, res) => {
  const errors = [];
  const checkTokenResult = (await checkToken(req.body.token)) || {};

  if (checkTokenResult.status === "fail") {
    errors.push(checkTokenResult.errorText);
  }

  if (!req.body.statusChange) {
    errors.push("Дата не указана");
  }

  if (!req.params.replicaId) {
    errors.push("ID реплики не указан");
  } else if (req.params.replicaId.length !== 24) {
    errors.push("ID реплики указан неверно");
  }

  const replica = await Replica.findById(req.params.replicaId);

  if (!replica) {
    errors.push("Реплика не найдена");
  }

  if (errors.length) {
    return res.json(getErrorData(errors));
  } else {
    const user = checkTokenResult.user;

    const date = req.body.statusChange;
    const day = date.substr(0, 2);
    const month = date.substr(3, 2) - 1;
    const year = date.substr(6, 4);

    replica.modifiedBy = user._id;
    replica.modifiedDate = Date.now();
    replica.statusChange = new Date(year, month, day, 0, 0, 0);

    await replica.save();

    res.json({
      status: "success",
    });
  }
};

module.exports = updateReplicaStatusChange;
