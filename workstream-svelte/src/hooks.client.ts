import { afterNavigate } from '$app/navigation';
import { config } from '$lib/utils/config';

function shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
	const order = ['debug', 'info', 'warn', 'error'];
	return order.indexOf(level) >= order.indexOf(config.logLevel);
}

if (shouldLog('info')) {
	afterNavigate((e) => {
		console[config.logLevel === 'debug' ? 'log' : 'info']('[nav]', e.to?.url?.pathname ?? '/');
	});
}

window.addEventListener('error', (ev) => {
	if (shouldLog('error')) console.error('[error]', ev.error || ev.message);
});
window.addEventListener('unhandledrejection', (ev) => {
	if (shouldLog('error')) console.error('[unhandledrejection]', ev.reason);
});
