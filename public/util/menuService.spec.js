describe('The menu service', function() {

  beforeEach(module('util.menuService'));

  beforeEach(module(['$provide', function($provide) {
    $provide.factory('testService', function() {
      return {visible: true};
    });
  }]));

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

  it('menu items can be registered with an optional injectable `visible` function', inject(function(testService) {

    var item = {
      title: "test",
      action: function() {},
      visible: ['testService', function(testService) { return testService.visible; }],
    };

    menuService.registerItem(item);
    expect(menuService.currentItems().length).to.be(1);
    testService.visible = false;
    expect(menuService.currentItems().length).to.be(0);

  }));

  it('should be possible to register item generators', inject(function(testService) {
    menuService.registerItemGenerator({
      generator: ['testService', function(testService) {
        var items = [
          {title: 'a', action: function() {}},
        ];

        if (testService.visible) {
          items.push({title: 'b', action: function() {}});
        }
        return items;
      }]
    });

    expect(menuService.currentItems().length).to.be(2);
    testService.visible = false;
    expect(menuService.currentItems().length).to.be(1);
  }));

});
