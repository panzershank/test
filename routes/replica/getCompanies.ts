/* ==========================================================================
   Выбираем список доступных компаний для пользователя
   ========================================================================== */

import { Request, Response } from 'express';
import mongoose, { mongo, Types } from 'mongoose'; // Added mongoose default import and Types
import moment from 'moment';

import checkToken from "../../utils/token";
import getErrorData from "../../utils/errors";
import CompaniesModel from "../../models/companies"; // Renamed to avoid conflict with interface
import UsersInProjectModel from "../../models/users-in-project"; // Renamed to avoid conflict with interface
// Replica model is not directly used with methods, so an interface for its structure is sufficient.

// Define interfaces based on usage

// Type for individual conditions in MongoDB query arrays
type MongoQueryValue = string | boolean | Types.ObjectId | Date | number | null | (string | undefined)[] | Types.ObjectId[];
interface MongoCondition {
  [key: string]: MongoQueryValue | { $in: MongoQueryValue } | { $eq: MongoQueryValue } | { $gte: MongoQueryValue } | { $lte: MongoQueryValue };
}

// Basic Mongoose Document Structure
interface BaseDocument {
  _id: Types.ObjectId;
  active: boolean;
  deleted: boolean;
  // Add other common fields if known, e.g., createdAt, updatedAt
}

// Interface for Company Document (adjust fields as necessary based on actual model)
interface Company extends BaseDocument {
  name: string;
  search?: string;
  createdBy: Types.ObjectId | string; // Or a more specific User type
  createdDate: Date | string;
  deleteMsg?: string;
  modifiedBy?: Types.ObjectId | string; // Or a more specific User type
  modifiedDate?: Date | string;
  // Add any other fields accessed from Companies model
}

// Interface for UsersInProject Document
interface UserInProjectDocument extends BaseDocument {
  userId: string | Types.ObjectId; // Based on user._id.toString()
  projectId: PopulatedProject | Types.ObjectId; // Populated or just ID
  // companyId is part of projectId when populated
}

// Interface for Replica Document (based on usage in $lookup and $match)
interface ReplicaDocument {
  deleted: boolean;
  company: Types.ObjectId; // links to Company._id
  platform?: string; // Optional based on usage
  status?: Types.ObjectId; // links to a Status collection
  category?: Types.ObjectId; // links to a Category collection
  date: Date; // Assuming 'date' is a Date object
  statusChange?: Date; // Assuming 'statusChange' is a Date object
  type: number | null;
  parentId: string | null;
  search?: string; // For the $regex match
  project: Types.ObjectId; // links to a Project collection
  // Add any other fields accessed from Replica model in the aggregation
}

interface ReqQuery {
  token?: string;
  'f-company'?: string;
  'f-search'?: string;
  'f-project'?: string;
  parentId?: string;
  type?: string;
  'f-dateTo'?: string;
  'f-dateFrom'?: string;
  'f-status'?: string;
  'f-category'?: string;
  'f-platform'?: string;
  'f-status-change'?: string;
}

interface User {
  _id: Types.ObjectId | string; // Assuming user._id can be string from .toString()
  role: {
    accessLevel: number;
  };
}

interface CheckTokenResult {
  status: 'success' | 'fail';
  errorText?: string;
  user?: User;
}

const getCompanies = async (req: Request<{}, {}, {}, ReqQuery>, res: Response) => {
    const errors: string[] = [];
    const checkTokenResult: CheckTokenResult = await checkToken(req.query.token) || {};

    const company: string | undefined = req.query['f-company'];
    const searchInput: string | undefined = req.query['f-search'];
    const project: string | undefined = req.query['f-project'];
    const parentId: string | null = req.query.parentId ? req.query.parentId : null;
    const type: number | null = (!req.query['type'] || req.query['type'] === "null") ? null : +req.query['type'];
    const to: string | undefined = req.query['f-dateTo']
    const from: string | undefined = req.query['f-dateFrom']
    const dateFrom: string = moment(from, 'DD/MM/YYYY HH:mm:ss').startOf('day').toISOString()
    const dateTo: string = moment(to, 'DD/MM/YYYY HH:mm:ss').endOf('day').toISOString()
    const status: string | undefined = req.query['f-status']
    const category: string | undefined = req.query['f-category']
    const platform: string | undefined = req.query['f-platform']
    const statusChange: string | null = req.query['f-status-change'] ? req.query['f-status-change'] : null

    const platforms: (string | undefined)[] = [ // Added type for platforms array
        platform,
        ` ${platform}`,
        `\r\n${platform}`,
        `\r\n${platform} `,
        `\n\r${platform}`,
        `\r${platform}`,
        `\n${platform}`,
        ` \r${platform}`,
        ` \n${platform}`,
        `${platform} `,
        `${platform}\r\n`,
        `${platform}\n\r`,
        `${platform}\r`,
        `${platform}\n`,
        `${platform}\r `,
        `${platform}\n `,
        ` ${platform} `,
    ];

    if (checkTokenResult.status === 'fail') {
        errors.push(checkTokenResult.errorText!) // Added non-null assertion
    }

    if (errors.length) {
        return res.json(getErrorData(errors))
    } else {
        const user = checkTokenResult.user!; // Added non-null assertion

        // Если пользователь не админ, выбираем связи проектов с пользователями
        if (user.role.accessLevel === 1) {
            const whereConditions: (MongoCondition | false | undefined)[] = [
                {$eq: ["$deleted", false]},
                {
                    $eq: [
                        "$$id",
                        "$company"
                    ]
                },
                platform && {$in: ["$platform", platforms]},
                status && {$eq: ["$status", new mongo.ObjectId(status)]},
                category && {$eq: ["$category", new mongo.ObjectId(category)]},
                dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]},
                dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]},
                {$eq: ["$type", type]},
                {$eq: ["$parentId", parentId]},
            ];
            const where: MongoCondition[] = whereConditions.filter(Boolean) as MongoCondition[];
            // Define an interface for the aggregated company data
            interface AggregatedCompany {
                // _id is projected out (set to 0)
                id: Types.ObjectId; // This is the original Company._id
                name: string;
                search?: string;
                active: boolean;
                createdBy: Types.ObjectId | string;
                createdDate: Date | string;
                deleteMsg?: string;
                delete?: boolean; // This field is named 'delete' in projection, consider renaming if problematic
                modifiedBy?: Types.ObjectId | string;
                modifiedDate?: Date | string;
                count: number;
            }

            const companies: AggregatedCompany[] = await CompaniesModel.aggregate<AggregatedCompany>([ // Use model with renamed import
                {
                    $match: {
                        active: true,
                        deleted: false,
                    }
                },
                {
                    $lookup:
                        {
                            from: "replica",
                            let: {
                                id: "$_id"
                            },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: where,
                                        },
                                        ...(searchInput && {
                                            search: {
                                                "$regex": searchInput,
                                                "$options": "i",
                                            },
                                        }),
                                    },
                                }
                            ],
                            as: "total"
                        }
                },
                // {$sort: {name: 1, _id: 1}},

                {
                    $project: {
                        _id: 0,
                        id: "$_id",
                        name: "$name",
                        search: "$search",
                        active: "$active",
                        createdBy: "$createdBy",
                        createdDate: "$createdDate",
                        deleteMsg: "$deleteMsg",
                        delete: "$delete",
                        modifiedBy: "$modifiedBy",
                        modifiedDate: "$modifiedDate",
                        "count": {
                            "$size": "$total"
                        }
                    }
                },
                {$sort: {name: 1, _id: 1}},
            ]).allowDiskUse(true);

            res.json({
                status: 'success',
                data: companies
            })
        } else {
            // Define a more specific type for populated projectId if possible
            // For now, using 'any' to avoid blocking conversion
            interface PopulatedProject {
                _id: Types.ObjectId;
                companyId: Types.ObjectId;
            }
            interface UserInProject {
                projectId: PopulatedProject;
            }

            const usersInProject: UserInProject[] = await UsersInProject.find({
                active: true,
                deleted: false,
                userId: user._id.toString()
            }).populate('projectId', '_id companyId').select('projectId').lean<UserInProjectDocument[]>(); // Specify lean type

            const projectIds: Types.ObjectId[] = usersInProject ? usersInProject.map(p => new mongo.ObjectId( (p.projectId as PopulatedProject)._id.toString())) : [];

            const ids: Types.ObjectId[] = usersInProject ? usersInProject.map(p => new mongo.ObjectId( (p.projectId as PopulatedProject).companyId.toString())) : [];

            // console.log(`[getCompanies] ids: ${JSON.stringify(ids)}`)

            // Выбираем список компаний, если они доступны
            if (ids.length) {

                const whereConditions: (MongoCondition | false | undefined)[] = [
                    {$eq: ["$deleted", false]},
                    {
                        $eq: [
                            "$$id",
                            "$company"
                        ]
                    },
                    platform && {$in: ["$platform", platforms]},
                    status && {$eq: ["$status", new mongo.ObjectId(status)]},
                    category && {$eq: ["$category", new mongo.ObjectId(category)]},
                    dateFrom && {$gte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateFrom)]},
                    dateTo && {$lte: [statusChange === "Y" ? "$statusChange" : "$date", new Date(dateTo)]},
                    {$eq: ["$type", type]},
                    {$eq: ["$parentId", parentId]},
                    ids.length > 0 && {$in: ["$company", ids]},
                    projectIds.length > 0 && {$in: ["$project", projectIds]},
                ];
                const where: MongoCondition[] = whereConditions.filter(Boolean) as MongoCondition[];

                const companies: AggregatedCompany[] = await CompaniesModel.aggregate<AggregatedCompany>([ // Use model with renamed import
                    {
                        $match: {
                            _id: {$in: ids},
                            active: true,
                            deleted: false,
                        }
                    },
                    {
                        $lookup:
                            {
                                from: "replica",
                                let: {
                                    id: "$_id"
                                },
                                pipeline: [
                                    {
                                        $match: {
                                            $expr: {
                                                $and: where
                                            },
                                            ...(searchInput && {
                                                search: {
                                                    "$regex": searchInput,
                                                    "$options": "i",
                                                },
                                            }),
                                        },
                                    }
                                ],
                                as: "total"
                            }
                    },
                    {$sort: {name: 1, _id: 1}},
                    {
                        $project: {
                            _id: 0,
                            id: "$_id",
                            name: "$name",
                            search: "$search",
                            active: "$active",
                            createdBy: "$createdBy",
                            createdDate: "$createdDate",
                            deleteMsg: "$deleteMsg",
                            delete: "$delete",
                            modifiedBy: "$modifiedBy",
                            modifiedDate: "$modifiedDate",
                            "count": {
                                "$size": "$total"
                            }
                        }
                    }
                ]);


                res.json({
                    status: 'success',
                    data: companies
                })
            } else {
                return res.json(getErrorData('Компании отсутствуют'))
            }
        }
    }
}

// Replica model import might be needed if its methods are used directly
// For now, it's only used in $lookup, so direct import might not be needed.

// It's good practice to type the response data as well
interface ResponseData {
  status: 'success' | 'fail';
  data?: AggregatedCompany[] | string; // data can be string for error messages from getErrorData
  // Potentially add 'error' or other fields if getErrorData returns a more complex object
}

export default getCompanies;
