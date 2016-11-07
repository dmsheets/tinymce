define(
  'ephox.alloy.spec.MenuSpec',

  [
    'ephox.alloy.api.behaviour.Highlighting',
    'ephox.alloy.construct.EventHandler',
    'ephox.alloy.menu.build.ItemType',
    'ephox.alloy.menu.build.SeparatorType',
    'ephox.alloy.menu.build.WidgetType',
    'ephox.alloy.menu.util.ItemEvents',
    'ephox.alloy.menu.util.MenuEvents',
    'ephox.alloy.menu.util.MenuMarkers',
    'ephox.alloy.registry.Tagger',
    'ephox.alloy.spec.SpecSchema',
    'ephox.alloy.spec.UiSubstitutes',
    'ephox.boulder.api.FieldPresence',
    'ephox.boulder.api.FieldSchema',
    'ephox.boulder.api.Objects',
    'ephox.boulder.api.ValueSchema',
    'ephox.compass.Arr',
    'ephox.highway.Merger',
    'ephox.peanut.Fun',
    'ephox.perhaps.Option',
    'global!Error'
  ],

  function (Highlighting, EventHandler, ItemType, SeparatorType, WidgetType, ItemEvents, MenuEvents, MenuMarkers, Tagger, SpecSchema, UiSubstitutes, FieldPresence, FieldSchema, Objects, ValueSchema, Arr, Merger, Fun, Option, Error) {
    var itemSchema = ValueSchema.choose(
      'type',
      {
        widget: WidgetType,
        item: ItemType,
        separator: SeparatorType
      }
    );

    var menuSchema = [
      FieldSchema.strict('value'),
      FieldSchema.strict('items'),
      FieldSchema.strict('dom'),
      FieldSchema.strict('components'),
      FieldSchema.field(
        'markers',
        'markers',
        FieldPresence.strict(),
        MenuMarkers.schema()
      ),
      FieldSchema.field(
        'members',
        'members',
        FieldPresence.strict(),
        ValueSchema.objOf([
          FieldSchema.strict('item')
        ])
      ),

      FieldSchema.defaulted('fakeFocus', false),
      FieldSchema.defaulted('onHighlight', Fun.noop)
    ];

    var make = function (spec) {
      var detail = SpecSchema.asStructOrDie('menu.spec', menuSchema, spec, [ ]);

      var builtItems = Arr.map(detail.items(), function (i) {
        var munged = detail.members().item().munge(i);
        var fallbackUid = Tagger.generate('');
        var merged = Merger.deepMerge({
          uid: fallbackUid
        }, i, munged, {
          ignoreFocus: detail.fakeFocus()
        });

        var itemInfo = ValueSchema.asStructOrDie('menu.spec item', itemSchema, merged);

        return itemInfo.builder()(itemInfo);
      });

      var placeholders = {
        '<alloy.menu.items>': UiSubstitutes.multiple(builtItems)
      };
      
      var components = UiSubstitutes.substitutePlaces(Option.none(), detail, detail.components(), placeholders, { });

      return {
        uiType: 'custom',
        dom: Merger.deepMerge(
          detail.dom(),
          {
            attributes: {
              role: 'menu'
            }
          }
        ),
        uid: detail.uid(),
        highlighting: {
          // Highlighting for a menu is selecting items inside the menu
          highlightClass: detail.markers().selectedItem(),
          itemClass: detail.markers().item(),
          onHighlight: detail.onHighlight()
        },
        events: Objects.wrapAll([
          { 
            key: ItemEvents.focus(),
            value: EventHandler.nu({
              run: function (menu, simulatedEvent) {
                // Highlight the item
                var event = simulatedEvent.event();
                menu.getSystem().getByDom(event.target()).each(function (item) {
                  Highlighting.highlight(menu, item);

                  simulatedEvent.stop();

                  // Trigger the focus event on the menu.
                  var focusTarget = menu.element();
                  menu.getSystem().triggerEvent(MenuEvents.focus(), focusTarget, {
                    target: Fun.constant(focusTarget),
                    menu: Fun.constant(menu),
                    item: item
                  });
                });
              }
            })
          },

          {
            key: ItemEvents.hover(),
            value: EventHandler.nu({
              // Hide any irrelevant submenus and expand any submenus based 
              // on hovered item
              run: function (menu, simulatedEvent) {
                var item = simulatedEvent.event().item();
                Highlighting.highlight(menu, item);
              }
            })
          }
        ]),
        representing: {
          query: function () {
            return detail.value();
          },
          set: function () { }
        },
        components: components
      };
    };

    return {
      schema: Fun.constant(menuSchema),
      make: make
    };
  }
);