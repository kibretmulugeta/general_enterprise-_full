const { authorizeRoles } = require('../middleware/rbac.middleware');
const { authorizePermission } = require('../middleware/pbac.middleware');

describe('RBAC & PBAC Authorization Middleware Suite', () => {
  it('should block unauthenticated requests in RBAC', () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    const next = jest.fn();

    const middleware = authorizeRoles('Admin');
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow Admin role in RBAC', () => {
    const req = { user: { role: 'Admin' } };
    const res = {};
    const next = jest.fn();

    const middleware = authorizeRoles('Admin', 'Super Admin');
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('should allow Super Admin bypass in PBAC', async () => {
    const req = { user: { role: 'Super Admin' } };
    const res = {};
    const next = jest.fn();

    const middleware = authorizePermission('user.delete');
    await middleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
