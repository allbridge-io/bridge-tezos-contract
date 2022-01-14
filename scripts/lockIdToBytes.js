const { Parser, packDataBytes } = require("@taquito/michel-codec");
function fromExp(s) {
  function add(x, y) {
    var c = 0,
      r = [];
    var x = x.split("").map(Number);
    var y = y.split("").map(Number);
    while (x.length || y.length) {
      var s = (x.pop() || 0) + (y.pop() || 0) + c;
      r.unshift(s < 10 ? s : s - 10);
      c = s < 10 ? 0 : 1;
    }
    if (c) r.unshift(c);
    return r.join("");
  }

  var dec = "0";
  s.split("").forEach(function (chr) {
    var n = parseInt(chr, 16);
    for (var t = 8; t; t >>= 1) {
      dec = add(dec, dec);
      if (n & t) dec = add(dec, "1");
    }
  });
  return dec;
}
module.exports = function (lockIdHex) {
  const parser = new Parser();
  const dataJSON = parser.parseMichelineExpression(fromExp(lockIdHex));
  const typeJSON = parser.parseMichelineExpression("nat");
  const packed = packDataBytes(dataJSON, typeJSON);
  return packed.bytes;
};
