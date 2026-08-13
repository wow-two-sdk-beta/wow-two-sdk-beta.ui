import { describe, it } from 'vitest';
import { iconsCases } from './IconsCases';
import { assertMounts } from '../../../support/Smoke';

describe('foundation/icons — mounts', () => {
  for (const testCase of iconsCases) {
    it(`${testCase.name} mounts`, async () => {
      await assertMounts(testCase);
    });
  }
});
