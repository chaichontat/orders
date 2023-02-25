import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import type { UserConfig } from 'vite';

const config: UserConfig = {
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			$src: path.resolve('./src'),
			$comps: path.resolve('./src/lib/components')
		}
	},
	build: {
		target: 'esnext',
		chunkSizeWarningLimit: 1024
	}
};

export default config;
