import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('returns status ok with a timestamp', () => {
    const before = new Date().toISOString();
    const result = controller.check();
    const after = new Date().toISOString();

    expect(result.status).toBe('ok');
    expect(result.timestamp >= before).toBe(true);
    expect(result.timestamp <= after).toBe(true);
  });
});
