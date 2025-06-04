/* ==========================================================================
   Получение плана для проекта
   ========================================================================== */

const checkToken = require("../../utils/token");
const getErrorData = require("../../utils/errors");
const Plan = require("../../models/plan");
const PlanDetail = require("../../models/plan-detail");
const Replica = require("../../models/replica");
const moment = require("moment");
const statusesList = require("../../utils/statuses");

const getPlan = async (req, res) => {
  const errors = [];
  const checkTokenResult = (await checkToken(req.query.token)) || {};

  if (checkTokenResult.status === "fail") {
    errors.push(checkTokenResult.errorText);
  }

  if (!req.query.project) {
    errors.push("Проект не выбран");
  } else if (req.query.project.length !== 24) {
    errors.push("ID проекта указано с ошибкой");
  }

  if (errors.length) {
    return res.json(getErrorData(errors));
  } else {
    const planPrint = [];

    // Выбираем список реплик проекта
    const replica = [];

    const arrReplica = await Replica.find({
      deleted: false,
      project: req.query.project,
    }).select("date platform url status type");

    if (arrReplica && arrReplica.length) {
      for (const item of arrReplica) {
        replica.push({
          domain: item.platform,
          url: item.url,
          date: item.date,
          status: item.status.toString(),
          type: item.type && parseInt(item.type) ? parseInt(item.type) : 0,
        });
      }
    }

    const arrTypes = {};

    const arrPlan = await Plan.find({
      deleted: false,
      project: req.query.project,
    }).sort([["dateFrom", 1]]);

    if (arrPlan && arrPlan.length) {
      const arrRemainderPrev = {};

      const rowNumber = {};
      let counter = 1;
      let randomId = 1;

      for (const plan of arrPlan) {
        if (plan.dateFrom && plan.dateTo) {
          const planType =
            plan.type && parseInt(plan.type) ? parseInt(plan.type) : 0;

          if (!rowNumber[planType]) {
            rowNumber[planType] = 1;
          }

          const info = {
            id: plan._id.toString(),
            rowNumber: rowNumber[planType],
            dateStart: moment(plan.dateFrom).format("DD.MM.YYYY"),
            dateEnd: moment(plan.dateTo).format("DD.MM.YYYY"),
            remainsOld: 0,
            needed: 0,
            remains: 0,
            used: 0,
            agreed: 0,
            posted: 0,
            items: [],
            isOpen: false,
          };

          const arrPlanDetail = await PlanDetail.find({
            plan: info.id,
            deleted: false,
          });

          if (arrPlanDetail && arrPlanDetail.length) {
            const arrDomains = {};

            for (const planDetail of arrPlanDetail) {
              if (planDetail.domain) {
                if (!arrDomains[planDetail.domain]) {
                  arrDomains[planDetail.domain] = [];
                }

                arrDomains[planDetail.domain].push(planDetail._id.toString());
              }
            }

            if (arrDomains && Object.keys(arrDomains).length) {
              const arrDomainsFinal = Object.keys(arrDomains)
                .sort()
                .reduce((obj, key) => {
                  obj[key] = arrDomains[key];
                  return obj;
                }, {});

              if (arrDomainsFinal && Object.keys(arrDomainsFinal).length) {
                for (const domain in arrDomainsFinal) {
                  if (
                    arrDomainsFinal[domain] &&
                    arrDomainsFinal[domain].length
                  ) {
                    if (arrDomainsFinal[domain].length > 1) {
                      let infoDetailParent = {};

                      for (const id of arrDomainsFinal[domain]) {
                        for (const planDetail of arrPlanDetail) {
                          if (
                            planDetail._id.toString() === id &&
                            planDetail.domain
                          ) {
                            if (!infoDetailParent.id) {
                              infoDetailParent = {
                                id: randomId,
                                name: planDetail.domain,
                                url: planDetail.url ? planDetail.url : "",
                                remainsOld: 0,
                                needed: 0,
                                remains: 0,
                                used: 0,
                                agreed: 0,
                                posted: 0,
                                items: [],
                                isOpen: false,
                              };

                              randomId++;
                            }

                            const infoDetail = {
                              id: planDetail._id.toString(),
                              name: planDetail.domain,
                              url: planDetail.url ? planDetail.url : "",
                              remainsOld: 0,
                              needed: 0,
                              remains: 0,
                              used: 0,
                              agreed: 0,
                              posted: 0,
                              items: [],
                              isOpen: false,
                            };

                            if (!arrRemainderPrev[planDetail.url]) {
                              // if (planDetail.remainderPrev && counter === 1) {
                              if (planDetail.remainderPrev) {
                                arrRemainderPrev[planDetail.url] =
                                  planDetail.remainderPrev;
                              } else {
                                arrRemainderPrev[planDetail.url] = 0;
                              }
                            }

                            let remainsDecrement = 0;

                            for (const item of replica) {
                              const date = moment(item.date).unix();
                              const dateFrom = moment(plan.dateFrom).unix();
                              const dateTo = moment(plan.dateTo).unix();

                              if (
                                date >= dateFrom &&
                                date <= dateTo &&
                                item.url === planDetail.url &&
                                planType === item.type
                              ) {
                                // Написано
                                if (
                                  item.status === statusesList.created ||
                                  item.status === statusesList.waiting
                                  // item.status === statusesList.posting ||
                                  // item.status === statusesList.moderation ||
                                  // item.status === statusesList.posted ||
                                  // item.status === statusesList.refused
                                ) {
                                  infoDetailParent.used += 1;
                                  infoDetail.used += 1;
                                  info.used += 1;
                                }

                                // Согласовано
                                if (
                                  item.status === statusesList.posting ||
                                  item.status === statusesList.moderation
                                  // item.status === statusesList.posted
                                ) {
                                  infoDetailParent.agreed += 1;
                                  infoDetail.agreed += 1;
                                  info.agreed += 1;
                                }

                                // Размещено
                                if (item.status === statusesList.posted) {
                                  infoDetailParent.posted += 1;
                                  infoDetail.posted += 1;
                                  info.posted += 1;
                                }

                                // Остаток
                                if (
                                  item.status === statusesList.created ||
                                  item.status === statusesList.waiting ||
                                  item.status === statusesList.posting ||
                                  item.status === statusesList.moderation ||
                                  item.status === statusesList.posted
                                ) {
                                  remainsDecrement += 1;
                                }
                              }
                            }

                            // Остаток предыдущего периода
                            infoDetailParent.remainsOld += arrRemainderPrev[
                              planDetail.url
                            ]
                              ? arrRemainderPrev[planDetail.url]
                              : 0;
                            infoDetail.remainsOld += arrRemainderPrev[
                              planDetail.url
                            ]
                              ? arrRemainderPrev[planDetail.url]
                              : 0;
                            info.remainsOld += arrRemainderPrev[planDetail.url]
                              ? arrRemainderPrev[planDetail.url]
                              : 0;

                            // if (planDetail.remainderPrev && parseInt(planDetail.remainderPrev)) {
                            // 	infoDetail.remainsOld = parseInt(planDetail.remainderPrev)
                            // 	info.remainsOld += parseInt(planDetail.remainderPrev)
                            // }

                            // Требуется
                            if (
                              planDetail.replicaRequired &&
                              parseInt(planDetail.replicaRequired)
                            ) {
                              infoDetailParent.needed += parseInt(
                                planDetail.replicaRequired
                              );
                              infoDetail.needed = parseInt(
                                planDetail.replicaRequired
                              );
                              info.needed += parseInt(
                                planDetail.replicaRequired
                              );
                            }

                            // Остаток
                            if (
                              planDetail.remainder &&
                              parseInt(planDetail.remainder)
                            ) {
                              infoDetailParent.remains += parseInt(
                                planDetail.remainder
                              );
                              infoDetail.remains = parseInt(
                                planDetail.remainder
                              );
                              info.remains += parseInt(planDetail.remainder);
                            } else {
                              infoDetailParent.remains =
                                infoDetail.remainsOld +
                                infoDetail.needed -
                                infoDetail.posted;
                              infoDetail.remains =
                                infoDetail.remainsOld +
                                infoDetail.needed -
                                infoDetail.posted;
                              info.remains =
                                infoDetail.remainsOld +
                                infoDetail.needed -
                                infoDetail.posted;
                            }

                            if (remainsDecrement > 0) {
                              infoDetailParent.remains -= remainsDecrement;
                              infoDetail.remains -= remainsDecrement;
                              info.remains -= remainsDecrement;

                              if (infoDetailParent.remains < 0)
                                infoDetailParent.remains = 0;
                              if (infoDetail.remains < 0)
                                infoDetail.remains = 0;
                              if (info.remains < 0) info.remains = 0;
                            }

                            arrRemainderPrev[planDetail.domain] =
                              infoDetail.remains;

                            infoDetailParent.items.push(infoDetail);
                          }
                        }
                      }

                      info.items.push(infoDetailParent);
                    } else {
                      for (const id of arrDomainsFinal[domain]) {
                        for (const planDetail of arrPlanDetail) {
                          if (
                            planDetail._id.toString() === id &&
                            planDetail.domain
                          ) {
                            const infoDetail = {
                              id: planDetail._id.toString(),
                              name: planDetail.domain,
                              url: planDetail.url ? planDetail.url : "",
                              remainsOld: 0,
                              needed: 0,
                              remains: 0,
                              used: 0,
                              agreed: 0,
                              posted: 0,
                              items: [],
                              isOpen: false,
                            };

                            if (!arrRemainderPrev[planDetail.url]) {
                              // if (planDetail.remainderPrev && counter === 1) {
                              if (planDetail.remainderPrev) {
                                arrRemainderPrev[planDetail.url] =
                                  planDetail.remainderPrev;
                              } else {
                                arrRemainderPrev[planDetail.url] = 0;
                              }
                            }

                            let remainsDecrement = 0;

                            for (const item of replica) {
                              const date = moment(item.date).unix();
                              const dateFrom = moment(plan.dateFrom).unix();
                              const dateTo = moment(plan.dateTo).unix();

                              if (
                                date >= dateFrom &&
                                date <= dateTo &&
                                item.url === planDetail.url
                              ) {
                                // Написано
                                if (
                                  item.status === statusesList.created ||
                                  item.status === statusesList.waiting
                                  // item.status === statusesList.posting ||
                                  // item.status === statusesList.moderation ||
                                  // item.status === statusesList.posted ||
                                  // item.status === statusesList.refused
                                ) {
                                  infoDetail.used += 1;
                                  info.used += 1;
                                }

                                // Согласовано
                                if (
                                  item.status === statusesList.posting ||
                                  item.status === statusesList.moderation
                                  // item.status === statusesList.posted
                                ) {
                                  infoDetail.agreed += 1;
                                  info.agreed += 1;
                                }

                                // Размещено
                                if (item.status === statusesList.posted) {
                                  infoDetail.posted += 1;
                                  info.posted += 1;
                                }

                                // Остаток
                                if (
                                  item.status === statusesList.created ||
                                  item.status === statusesList.waiting ||
                                  item.status === statusesList.posting ||
                                  item.status === statusesList.moderation ||
                                  item.status === statusesList.posted
                                ) {
                                  remainsDecrement += 1;
                                }
                              }
                            }

                            // Остаток предыдущего периода
                            infoDetail.remainsOld += arrRemainderPrev[
                              planDetail.url
                            ]
                              ? arrRemainderPrev[planDetail.url]
                              : 0;
                            info.remainsOld += arrRemainderPrev[planDetail.url]
                              ? arrRemainderPrev[planDetail.url]
                              : 0;

                            // if (planDetail.remainderPrev && parseInt(planDetail.remainderPrev)) {
                            // 	infoDetail.remainsOld = parseInt(planDetail.remainderPrev)
                            // 	info.remainsOld += parseInt(planDetail.remainderPrev)
                            // }

                            // Требуется
                            if (
                              planDetail.replicaRequired &&
                              parseInt(planDetail.replicaRequired)
                            ) {
                              infoDetail.needed = parseInt(
                                planDetail.replicaRequired
                              );
                              info.needed += parseInt(
                                planDetail.replicaRequired
                              );
                            }

                            // Остаток
                            if (
                              planDetail.remainder &&
                              parseInt(planDetail.remainder)
                            ) {
                              infoDetail.remains = parseInt(
                                planDetail.remainder
                              );
                              info.remains += parseInt(planDetail.remainder);
                            } else {
                              infoDetail.remains =
                                infoDetail.remainsOld +
                                infoDetail.needed -
                                infoDetail.posted;
                              info.remains =
                                infoDetail.remainsOld +
                                infoDetail.needed -
                                infoDetail.posted;
                            }

                            if (remainsDecrement > 0) {
                              infoDetail.remains -= remainsDecrement;
                              info.remains -= remainsDecrement;

                              if (infoDetail.remains < 0)
                                infoDetail.remains = 0;
                              if (info.remains < 0) info.remains = 0;
                            }

                            arrRemainderPrev[planDetail.domain] =
                              infoDetail.remains;

                            info.items.push(infoDetail);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          } else {
            info.items.push({
              id: randomId,
              name: "",
              remainsOld: 0,
              needed: 0,
              remains: 0,
              used: 0,
              agreed: 0,
              posted: 0,
            });

            randomId++;
          }

          if (!arrTypes[planType]) {
            arrTypes[planType] = {
              type:
                plan.type && parseInt(plan.type) ? parseInt(plan.type) : null,
              data: [],
            };
          }

          arrTypes[planType].data.push(info);
          counter++;
          rowNumber[planType]++;
        }
      }
    }

    if (arrTypes && Object.keys(arrTypes).length) {
      const arrTypesFinal = Object.keys(arrTypes)
        .sort()
        .reduce((obj, key) => {
          obj[key] = arrTypes[key];
          return obj;
        }, {});

      for (const item of Object.keys(arrTypesFinal)) {
        planPrint.push(arrTypesFinal[item]);
      }
    }

    res.json({
      status: "success",
      plan: planPrint,
    });
  }
};

module.exports = getPlan;
