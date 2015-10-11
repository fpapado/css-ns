var assert = require('chai').assert; // @see http://chaijs.com/api/assert/
var cssNs = require('./css-ns');
var React = require('react');
var ReactDOMServer = require('react-dom/server');

function assertEqualHtml(Component, expectedHtml) {
  assert.deepEqual(
    ReactDOMServer.renderToStaticMarkup(React.createElement(Component)),
    expectedHtml
  );
}

describe('css-ns', function() {

  describe('makeOptions()', function() {

    it('accepts a string', function() {
      assert.deepEqual(
        cssNs.makeOptions('MyComponent').namespace,
        'MyComponent'
      );
    });

    it('accepts a file path', function() {
      assert.deepEqual(
        cssNs.makeOptions('/path/to/MyComponent.jsx').namespace,
        'MyComponent'
      );
    });

    it('accepts a relative file path', function() {
      assert.deepEqual(
        cssNs.makeOptions('../MyComponent.jsx').namespace,
        'MyComponent'
      );
    });

    it('processes options only once', function() {
      assert.deepEqual(
        cssNs.makeOptions(cssNs.makeOptions('MyComponent')).namespace,
        'MyComponent'
      );
    });

    it('accepts an object', function() {
      assert.deepEqual(
        cssNs.makeOptions({ namespace: 'MyComponent' }).namespace,
        'MyComponent'
      );
    });

  });

  describe('nsAuto()', function() {

    it('handles falsy input', function() {
      assert.equal(cssNs.nsAuto('MyComponent', null), null);
    });

    it('handles class list input', function() {
      assert.equal(cssNs.nsAuto('Foo', 'bar'), 'Foo-bar');
    });

    it('handles React element input', function() {
      var MyComponent = function() {
        return cssNs.nsAuto('MyComponent',
          React.createElement('div', { className: 'row' })
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"></div>'
      );
    });

  });

  describe('nsClassList()', function() {

    describe('string input', function() {

      it('prefixes a single class', function() {
        assert.equal(cssNs.nsClassList('Foo', 'bar'), 'Foo-bar');
      });

      it('prefixes multiple classes', function() {
        assert.equal(cssNs.nsClassList('Foo', 'bar baz'), 'Foo-bar Foo-baz');
      });

      it('tolerates falsy values', function() {
        assert.equal(cssNs.nsClassList('Foo'), '');
      });

      it('tolerates exotic classNames and whitespace', function() {
        // ...not that using these would be a good idea for other reasons, but we won't judge!
        assert.equal(cssNs.nsClassList('Foo', '   bar-baz   lol{wtf$why%would__ANYONE"do.this}   '), 'Foo-bar-baz Foo-lol{wtf$why%would__ANYONE"do.this}');
      });

      it('supports an include option', function() {
        var options = {
          namespace: 'Foo',
          include: /^b/ // only prefix classes that start with b
        };
        assert.equal(
          cssNs.nsClassList(options, 'bar AnotherComponent car'),
          'Foo-bar AnotherComponent car'
        );
      });

      it('supports an exclude option', function() {
        var options = {
          namespace: 'Foo',
          exclude: /^([A-Z]|icon)/ // ignore classes that start with caps or "icon"
        };
        assert.equal(
          cssNs.nsClassList(options, 'bar AnotherComponent iconInfo baz'),
          'Foo-bar AnotherComponent iconInfo Foo-baz'
        );
      });

      it('supports both include and exclude at the same time', function() {
        var options = {
          namespace: 'Foo',
          include: /^[a-z]/, // include classes that start with lower-case
          exclude: /^icon/ // ...but still ignore the "icon" prefix
        };
        assert.equal(
          cssNs.nsClassList(options, 'bar iconInfo baz'),
          'Foo-bar iconInfo Foo-baz'
        );
      });

      it('supports a self option', function() {
        var options = {
          namespace: 'Foo',
          self: /^__ns__$/
        };
        assert.equal(cssNs.nsClassList(options, '__ns__ bar'), 'Foo Foo-bar');
      });

    });

    describe('array input', function() {

      it('prefixes classes', function() {
        assert.equal(cssNs.nsClassList('Foo', [ 'bar', 'baz' ]), 'Foo-bar Foo-baz');
      });

      it('tolerates falsy values', function() {
        assert.equal(cssNs.nsClassList('Foo', [ 'bar', null, 'baz', false ]), 'Foo-bar Foo-baz');
      });

    });

    describe('object input', function() {

      it('prefixes classes', function() {
        assert.equal(cssNs.nsClassList('Foo', { bar: true, baz: true }), 'Foo-bar Foo-baz');
      });

      it('tolerates falsy values', function() {
        assert.equal(cssNs.nsClassList('Foo', { bar: true, ignoreThis: null, baz: true, alsoThis: false }), 'Foo-bar Foo-baz');
      });

    });

  });

  describe('nsReactElement()', function() {

    it('prefixes a single className', function() {
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: 'row' })
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"></div>'
      );
    });

    it('supports array input', function() {
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: [ 'row' ] })
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"></div>'
      );
    });

    it('supports object input', function() {
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: { row: true } })
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"></div>'
      );
    });

    it('prefixes classNames recursively', function() {
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: 'row' },
            React.createElement('div', { className: 'column' })
          )
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"><div class="MyComponent-column"></div></div>'
      );
    });

    it('allows elements without a className', function() {
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: 'row' },
            React.createElement('section', null,
              React.createElement('div', { className: 'column' })
            )
          )
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-row"><section><div class="MyComponent-column"></div></section></div>'
      );
    });

    it('respects component boundaries', function() {
      var MyChildComponent = function() {
        return React.createElement('div', { className: 'protected' });
      };
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: 'container' },
            React.createElement(MyChildComponent, null)
          )
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-container"><div class="protected"></div></div>'
      );
    });

    it('respects ownership of children across components', function() {
      var MyChildComponent = function(props) {
        return React.createElement('div', { className: 'protected' }, props.children);
      };
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement(MyChildComponent, null,
            React.createElement('div', { className: 'owned' })
          )
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="protected"><div class="MyComponent-owned"></div></div>'
      );
    });

    it('works with nested components', function() {
      var MyChildComponent = function() {
        return cssNs.nsReactElement('MyChildComponent',
          React.createElement('div', { className: 'protected' })
        );
      };
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement('div', { className: 'container' },
            React.createElement(MyChildComponent, null)
          )
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-container"><div class="MyChildComponent-protected"></div></div>'
      );
    });

    it('prefixes classNames on components as well', function() {
      // This is a bit of an edge case, since for a component, a prop called "className" holds no special value.
      // But if you're using a prop with that name it's highly likely this is the behaviour you want.
      var MyChildComponent = function(props) {
        return React.createElement('div', { className: props.className });
      };
      var MyComponent = function() {
        return cssNs.nsReactElement('MyComponent',
          React.createElement(MyChildComponent, { className: 'parentInjectedName' })
        );
      };
      assertEqualHtml(
        MyComponent,
        '<div class="MyComponent-parentInjectedName"></div>'
      );
    });

  });

});
