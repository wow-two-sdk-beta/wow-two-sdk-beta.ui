import { useAppForm } from '@src/forms-engine/tanstack';

import { describeFormEngineConformance } from './FormEngineContract.shared';

// The tanstack adapter (@tanstack/react-form, optional peer) against the exact same
// shared behavioral matrix the house engine runs — two engines, one pinned behavior.
describeFormEngineConformance('tanstack', useAppForm);
