// @ts-nocheck
import { BaseRepository } from './BaseRepository';

export class ToolRequestRepository extends BaseRepository<any> {
  constructor() {
    super('tool_requests');
  }

  /**
   * Fetch tool requests with an optional status / movement_type filter.
   * Joins the `tools` collection via $lookup to resolve tool_name.
   */
  async findAllFiltered(filters?: { status?: string; movement_type?: string }) {
    const matchStage: Record<string, any> = {};
    if (filters?.status) matchStage.status = filters.status;
    if (filters?.movement_type) matchStage.movement_type = filters.movement_type;

    const pipeline: Record<string, any>[] = [
      ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
      {
        $lookup: {
          from: 'tools',
          let: { toolIdString: '$tool_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $ne: ['$$toolIdString', ''] },
                    { $eq: [{ $toString: '$_id' }, '$$toolIdString'] }
                  ]
                }
              }
            }
          ],
          as: 'toolDetails',
        },
      },
      {
        $addFields: {
          tool_name: {
            $let: {
              vars: { arr: '$toolDetails' },
              in: {
                $cond: [
                  { $gt: [{ $size: '$$arr' }, 0] },
                  { $arrayElemAt: ['$$arr.name', 0] },
                  null,
                ],
              },
            },
          },
        },
      },
      { $project: { toolDetails: 0 } },
      { $sort: { created_at: -1 } },
    ];

    const docs = await this.aggregate(pipeline);
    return this.toAppList(docs);
  }

  /**
   * Find the last document that has a ref_number (for sequential generation).
   */
  async findLastWithRef(): Promise<any | null> {
    const docs = await this.aggregate([
      { $match: { ref_number: { $exists: true, $ne: '' } } },
      { $sort: { ref_number: -1 } },
      { $limit: 1 },
    ]);
    return docs.length > 0 ? this.toApp(docs[0]) : null;
  }
}
