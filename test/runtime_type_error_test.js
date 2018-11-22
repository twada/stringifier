delete require.cache[require.resolve('..')];
const stringifier = require('..');
const assert = require('assert');
const stringify = stringifier.stringify;

if (typeof document !== 'undefined' && typeof document.getElementById === 'function') {
  describe('in case of runtime TypeError', () => {
    it('stringifying HTMLInputElement', () => {
      const input = document.getElementById('confirmation');
      const str = stringify(input, { maxDepth: 1 });
      assert(/^HTMLInputElement/.test(str));
      assert(/defaultChecked:false/.test(str));
      assert(/multiple:false/.test(str));
    });
  });
}
