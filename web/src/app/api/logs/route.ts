import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Try to get logs from the backend docker container.
    // The container name might be jobhubai-backend-1 or similar.
    const { stdout, stderr } = await execAsync('docker logs jobhubai-backend-1 --tail 50');
    return NextResponse.json({ success: true, logs: stdout, errors: stderr });
  } catch (error: any) {
    // If that fails, try docker-compose ps or something to see what's running
    try {
        const { stdout } = await execAsync('docker ps');
        return NextResponse.json({ success: false, message: 'Failed to get logs. Running containers:', containers: stdout, error: error.message });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: 'Cannot run docker', error: e.message });
    }
  }
}
