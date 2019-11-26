var toFraction = function (dec) {
    var is_neg = dec < 0;
    dec = Math.abs(dec);
    var done = false;
    //you can adjust the epsilon to a larger number if you don't need very high precision
    var n1 = 0, d1 = 1, n2 = 1, d2 = 0, n = 0, q = dec, epsilon = 1e-13;
    while (!done) {
        n++;
        if (n > 10000) {
            done = true;
        }
        var a = parseInt(q);
        var num = n1 + a * n2;
        var den = d1 + a * d2;
        var e = (q - a);
        if (e < epsilon) {
            done = true;
        }
        q = 1 / e;
        n1 = n2;
        d1 = d2;
        n2 = num;
        d2 = den;
        if (Math.abs(num / den - dec) < epsilon || n > 30) {
            done = true;
        }
    }
    return [is_neg ? -num : num, den];
};


function GCD(a, b) {
    x = Math.abs(a);
    y = Math.abs(b);
    while(y) {
        var t = y;
        y = x % y;
        x = t;
    }
    return x;
}

function LCM(a, b) {
    return Math.abs((a * b) / GCD(a, b));
}