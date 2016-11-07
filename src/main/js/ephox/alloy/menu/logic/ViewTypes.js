define(
  'ephox.alloy.menu.logic.ViewTypes',

  [
    'ephox.alloy.menu.grid.GridView',
    'ephox.alloy.menu.layered.LayeredView',
    'ephox.alloy.menu.widget.WidgetView',
    'ephox.boulder.api.FieldPresence',
    'ephox.boulder.api.FieldSchema',
    'ephox.boulder.api.Objects',
    'ephox.boulder.api.ValueSchema',
    'ephox.peanut.Fun'
  ],

  function (GridView, LayeredView, WidgetView, FieldPresence, FieldSchema, Objects, ValueSchema, Fun) {
    var schema = FieldSchema.field(
      'view',
      'view',
      FieldPresence.strict(),
      ValueSchema.choose(
        'style',
        {
          layered: LayeredView,
          grid: GridView,
          widget: WidgetView
        }
      )
    );

    var useWidget = function (spec) {
      return {
        style: 'widget',
        members: spec.members,
        markers: spec.markers,
        preprocess: Fun.identity
      };
    };

    var useGrid = function (spec) {
      return {
        style: 'grid',
        members: spec.members,
        markers: spec.markers,
        preprocess: Fun.identity,
        initSize: spec.initSize
      };
    };

    var useLayered = function (spec) {
      return {
        style: 'layered',
        members: spec.members,
        markers: spec.markers,
        preprocess: Fun.identity,
        scaffold: spec.scaffold
      };
    };

    var useList = function (spec) {
      return {
        style: 'layered',
        members: spec.members,
        markers: spec.markers,
        scaffold: spec.scaffold,
        preprocess: function (items) {
          var primary = 'blah';
          var expansions = {};
          var menus = Objects.wrap(primary, {
            name: primary,
            textkey: 'DOGS',
            items: items
          });

          return {
            primary: primary,
            expansions: expansions,
            menus: menus
          };
        }
      };
    };

    return {
      schema: Fun.constant(schema),
      useWidget: useWidget,
      useGrid: useGrid,
      useLayered: useLayered,
      useList: useList
    };
  }
);