/**
 * CRE Workflows Main Entry Point
 * Exports all workflow handlers for CRE platform
 */

export { main as tradeIntake } from './trade-intake';
export { main as matchingEngine } from './matching-engine';
export { main as settlement } from './settlement';
