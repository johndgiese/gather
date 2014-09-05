describe('The menu service', function() {

  beforeEach(module('join'));

  var menuService;
  beforeEach(inject(function(_menuService_) {
    menuService = _menuService_;
  }));

  it('allows you to register and retrieve menu items', function() {
    expect(menuService.registerItem).not.to.be(undefined);

    expect(menuService.currentItems().length).to.be(0);
    menuService.registerItem({title: "test", action: function() {}});
    expect(menuService.currentItems().length).to.be(1);
  });

  it('menu items can be registered with an optional injectable `visible` function', function() {
    var isOn = true;
    var ifIsOn = function() {
      return isOn;
    };
    var item = {
      title: "test",
      action: function() {},
      visible: ifIsOn,
    };
    menuService.registerItem(item);
    expect(menuService.currentItems().length).to.be(1);
    isOn = false;
    expect(menuService.currentItems().length).to.be(0);
  });

  it.skip('the action function can be an injectable', function() {
  });

});
