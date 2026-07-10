import { useAppForm } from '../house';

import { describeSchemaLibSeam } from './SchemaLibSeam.shared';

// The house micro-engine against the real-lib (zod 4 + valibot 1.x) validation matrix —
// the Standard Schema seam pinned by test, not doc (forms-vector-next.md §F-2c).
describeSchemaLibSeam('house', useAppForm);
