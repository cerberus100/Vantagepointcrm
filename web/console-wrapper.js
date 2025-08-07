// Production console wrapper - prevents console errors in older browsers
if (typeof console === 'undefined') {
    window.console = {
        log: function() {},
        error: function() {},
        warn: function() {},
        info: function() {},
        debug: function() {}
    };
}

// Disable console in production
if (window.location.hostname !== 'localhost') {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
}
