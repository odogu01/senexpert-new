// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class FinancialRequestRepository extends BaseRepository<any> {
  constructor() {
    super('financial_requests');
  }

  /**
   * Fetch financial requests with optional filters.
   * Joins the `profiles` collection via $lookup to resolve requester_name.
   */
  async findAllFiltered(filters?: { status?: string; requested_by?: string }) {
    const matchStage: Record<string, any> = {};
    if (filters?.status) matchStage.status = filters.status;
    if (filters?.requested_by) matchStage.requested_by = filters.requested_by;

    const pipeline: Record<string, any>[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $lookup: {
          from: 'profiles',
          localField: 'requested_by',
          foreignField: '_id',
          as: 'requestedByProfile',
        },
      },
      {
        $addFields: {
          requester_name: {
            $let: {
              vars: { arr: '$requestedByProfile' },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$arr' }, 0] },
                  { $arrayElemAt: ['$$arr.full_name', 0] },
                  null,
                ],
              },
            },
          },
        },
      },
      { $project: { requestedByProfile: 0 } },
      { $sort: { created_at: -1 } },
    ];

    const docs = await this.aggregate(pipeline);
    return this.toAppList(docs);
  }
}
