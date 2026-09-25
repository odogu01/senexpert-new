import { NextRequest, NextResponse } from 'next/server';
import { DevAuditLogRepository } from '@/services/repositories/DevAuditLogRepository';

type CommitInput = {
  commit_sha: string;
  message: string;
  author_name: string;
  author_email?: string;
  committed_at: string;
  url: string;
  added?: string[];
  modified?: string[];
  removed?: string[];
};

export async function POST(request: NextRequest) {
  const expectedToken = process.env.DEV_AUDIT_INGEST_TOKEN;
  if (!expectedToken) return NextResponse.json({ success: false, error: 'Ingest is not configured' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json() as { repository?: string; branch?: string; pushed_at?: string; commits?: CommitInput[] };
    if (!body.repository || !body.branch || !Array.isArray(body.commits) || body.commits.length > 100) {
      return NextResponse.json({ success: false, error: 'Invalid push payload' }, { status: 400 });
    }
    const pushedAt = new Date(body.pushed_at || Date.now());
    if (Number.isNaN(pushedAt.getTime())) return NextResponse.json({ success: false, error: 'Invalid push timestamp' }, { status: 400 });
    const repo = new DevAuditLogRepository();
    let recorded = 0;
    for (const commit of body.commits) {
      const committedAt = new Date(commit.committed_at);
      if (!/^[a-f0-9]{40}$/i.test(commit.commit_sha) || !commit.message || !commit.author_name || Number.isNaN(committedAt.getTime())) continue;
      const subject = commit.message.split('\n', 1)[0];
      await repo.recordCommit({
        commit_sha: commit.commit_sha, message: commit.message, author_name: commit.author_name,
        author_email: commit.author_email, committed_at: committedAt, pushed_at: pushedAt,
        branch: body.branch, repository: body.repository, url: commit.url,
        feature_added: /^feat(?:\([^)]*\))?:/i.test(subject),
        changed_files: [...(commit.added || []), ...(commit.modified || []), ...(commit.removed || [])],
      });
      recorded++;
    }
    return NextResponse.json({ success: true, recorded });
  } catch (error) {
    console.error('Developer audit ingest error:', error);
    return NextResponse.json({ success: false, error: 'Invalid ingest request' }, { status: 400 });
  }
}
