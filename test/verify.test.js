const
  should = require('should'),
  PluginOAuth = require('../lib'),
  sandbox = require('sinon').sandbox.create();

describe('#verify', () => {
  let
    pluginOauth,
    pluginContext = require('./mock/pluginContext.mock.js');

  beforeEach(() => {
    sandbox.reset();
    pluginOauth = new PluginOAuth();
    pluginOauth.getProviderRepository = sandbox.stub();
    pluginOauth.getCredentialsFromKuid = sandbox.stub().returns(Promise.resolve({foo: 'bar'}));
    pluginOauth.context = pluginContext;

    pluginOauth.config = {
      strategies: {
        facebook: {
          persist: ['name'],
          identifierAttribute: 'id'
        }
      }
    };
  });

  it('should resolve an existing user', () => {
    pluginOauth.getProviderRepository = sandbox.stub().returns({get: sandbox.stub().returns(Promise.resolve({kuid: '24'}))});
    return should(pluginOauth.verify(null, null, null, {provider: 'facebook', _json: {id: '42'}})).be.fulfilledWith({kuid: '24', message: null});
  });

  it('should resolve with the new user id and persist it', () => {
    pluginOauth.getProviderRepository = sandbox.stub().returns({get: sandbox.stub().returns(Promise.resolve(null))});
    pluginOauth.config.strategies.facebook.persist = ['name'];

    return pluginOauth.verify({}, null, null, {provider: 'facebook', _json: {id: '42', name: 'foo'}})
      .then(result => {
        should(result).match({kuid: '42', message: null});
        should(pluginOauth.context.accessors.execute.called).be.true();
      });
  });

  it('should resolve with the new user id and persist it with some mapping', (done) => {
    let status = 'pending';

    pluginOauth.getProviderRepository = sandbox.stub().returns({get: sandbox.stub().returns(Promise.resolve(null))});
    pluginOauth.context.constructors.Request = sandbox.stub().callsFake((request, req) => {
      try {
        should(req.body.content.kuzzleAttributesMapping).be.equal('Displayed name');
        status = 'verified';
      }
      catch (e) {
        status = 'error: ' + e;
      }
    });

    pluginOauth.config.strategies.facebook.persist = ['name'];
    pluginOauth.config.strategies.facebook.kuzzleAttributesMapping = {
      kuzzleAttributesMapping: 'displayName'
    };

    pluginOauth.verify({}, null, null, {provider: 'facebook', _json: {id: '42', name: 'foo', displayName: 'Displayed name'}})
      .then(() => {
        if (status === 'verified') {
          done();
        } else {
          done('Unexpected test result: ' + status);
        }
      })
      .catch(e => done(e));
  });
});
