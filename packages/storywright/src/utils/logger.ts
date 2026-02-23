import { createConsola } from 'consola';

const isCI = !!(
	process.env.CI ||
	process.env.GITHUB_ACTIONS ||
	process.env.CIRCLECI ||
	process.env.GITLAB_CI
);

export const logger = createConsola({
	fancy: !isCI,
	level: process.env.STORYWRIGHT_DEBUG ? 5 : 3,
});

export { isCI };
