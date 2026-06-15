/**
 * @scope4/agent — public API barrel
 * Member C — AI + Analytics Lead
 *
 * Export all agent modules so Member A's orchestrator can import them cleanly:
 *   import { runValidation, runCalculation, generateReport, runAnalytics } from '@scope4/agent'
 */

export { runValidation }   from './modules/validation'
export { runCalculation }  from './modules/calculation'
export { generateReport }  from './modules/report'
export { runAnalytics }    from './modules/analytics'
export { getBundleDetail, bundles, liveDemoBundle, dashboardSummary } from './modules/data/fixtures'
