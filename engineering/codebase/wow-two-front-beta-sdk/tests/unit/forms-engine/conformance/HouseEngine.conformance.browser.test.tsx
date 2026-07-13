import { useAppForm } from '@src/forms-engine/house';

import { describeFormEngineConformance } from './FormEngineContract.shared';

// The house micro-engine against the shared behavioral matrix. Phase 2 adds
// `TanstackEngine.conformance.browser.test.tsx` running the exact same suite.
describeFormEngineConformance('house', useAppForm);
