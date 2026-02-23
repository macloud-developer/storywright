import { spawn } from 'node:child_process';

export interface ExecResult {
	exitCode: number;
	stdout: string;
	stderr: string;
}

export function exec(
	command: string,
	args: string[],
	options?: { cwd?: string; env?: Record<string, string> },
): Promise<ExecResult> {
	return new Promise((resolve, reject) => {
		const proc = spawn(command, args, {
			cwd: options?.cwd,
			env: { ...process.env, ...options?.env },
			stdio: ['ignore', 'pipe', 'pipe'],
			shell: false,
		});

		let stdout = '';
		let stderr = '';

		proc.stdout.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		proc.stderr.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		proc.on('error', reject);

		proc.on('close', (code) => {
			resolve({ exitCode: code ?? 1, stdout, stderr });
		});
	});
}
