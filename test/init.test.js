const
  should = require('should'),
  rewire = require('rewire'),
  sinon = require('sinon'),
  PluginOAuth = rewire('../lib');

describe('The plugin oauth initialization', function () {
  let pluginOAuth;

  before(function () {
    pluginOAuth = new PluginOAuth();
  });

  it('should return an error if strategies config is empty', function() {
    const warnSpy = sinon.spy();
    return PluginOAuth.__with__({
      console: {
        warn: warnSpy
      }
    })(() => {
      pluginOAuth.init({});
      should(warnSpy.calledOnce).be.true();
    });
  });

  it('should return pluginOauth object if everything is ok', function () {
    should(pluginOAuth.init({persist: true, strategies: [{name: "facebook", clientID: "id", clientSecret: "secret", callbackUrl: "http://callback.url"}]})).be.Object();
  });
});
