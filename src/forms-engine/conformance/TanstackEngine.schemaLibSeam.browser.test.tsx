import { useAppForm } from '../tanstack';

import { describeSchemaLibSeam } from './SchemaLibSeam.shared';

// The tanstack adapter against the exact same real-lib (zod 4 + valibot 1.x) validation
// matrix the house engine runs — two engines, one seam, byte-identical messages.
describeSchemaLibSeam('tanstack', useAppForm);
