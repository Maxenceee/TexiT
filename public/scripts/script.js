this.gref_ = {
    CONFIG: {
        table: {
            // Size in cells
            cols: 10,
            rows: 16
        },
        pixel: {
            // Size in pixels
            size: 40
        },
        block: {
            /*
            * If you want that each block has it's own specific
            * color, make "staticColor" equal to true.
            */
            staticColor: false,
            /*
            * If you want to earn more money, and also play faster
            * make "fragile" equal to true.
            * Otherwise, your game will be harder. because it will
            * be harder to resolve the rows.
            */
            fragile: false
        },
        start: {
            lives: 3,
            speed: 1000,
            text: "Start the game!"
        },
        pause: {
            text: "~ PAUSE ~"
        },
        resume: {
            text: "Let's Play"
        },
        tryAgain: {
            text: "Press enter to TryAgain ;)"
        },
        over: {
            text: "GAME OVER :("
        },
        resolve: {
            speed: 50,
            price: 10
        },
        gravity: {
            speed: 100,
            delay: 200
        },
        keys: {
            KEY_ENTER: 13,
            KEY_CTRL: 17,
            KEY_LEFT: 37,
            KEY_UP: 38,
            KEY_RIGHT: 39,
            KEY_DOWN: 40,
            KEY_D: 68,
            KEY_S: 83,
            KEY_A: 65,
            KEY_W: 87,
            KEY_E: 69,
            KEY_Q: 81,
        },
        COLOR_MAP: {
            1: "#F44336", // Red
            2: "#8BC34A", // Green
            3: "#FFEB3B", // Yellow
            4: "#9C27B0", // Purple
            5: "#00BCD4", // Cyan
            6: "#03A9F4", // Blue
            7: "#FF9800", // Orange
        },
        SHAPE_TYPES: {
            I: {
                color: 1,
                matrix: [
                [1],
                [1],
                [1],
                [1]
                ]
            },
            O: {
                color: 3,
                matrix: [
                [1, 1],
                [1, 1]
                ]
            },
            T: {
                color: 4,
                matrix: [
                [1, 1, 1],
                [0, 1, 0]
                ]
            },
            S: {
                color: 7,
                matrix: [
                [0, 1, 1],
                [1, 1, 0]
                ]
            },
            Z: {
                color: 6,
                matrix: [
                [1, 1, 0],
                [0, 1, 1]
                ]
            },
            J: {
                color: 5,
                matrix: [
                [0, 1],
                [0, 1],
                [1, 1]
                ]
            },
            L: {
                color: 2,
                matrix: [
                [1, 0],
                [1, 0],
                [1, 1]
                ]
            }
        }
    }
}
this.gref_ = this.gref_ || {};

(function(_){
    try {
        "use strict";

        _.keys = _.CONFIG.keys;

        _.PIXEL_MATRIX = {};
        _.IS_PAUSED = true;
        _.GAME_OVER = false;
        _.IS_CALCING = false; // Short for "IS_CALCULATING" :))))
        _.IS_LOADING = false;
        _.IS_PLAYING = false;

        _.getRandomIndex = (arr) => {
            var randomIndex = Math.floor(
                Math.random() * arr.length
            );
            return arr[randomIndex];
        }

        _.getRandomIndexNum = (arr) => {
            return Math.floor(Math.random() * arr.length);
        }

        _.getRandomProp = (obj) => {
            var propsArr = Object.keys(obj);
            var randomPropName = _.getRandomIndex(propsArr);
            return obj[randomPropName];
        }

        _.getRandomPropName = (obj) => {
            var propsArr = Object.keys(obj);
            return _.getRandomIndex(propsArr);
        }

        _.rotateMatrixToRight = (matrix) => {
            var M = matrix.length - 1;
            var newMatrix = [];

            for (var y = 0; y < matrix[0].length; y++) {
                newMatrix.push([]);
                for (var x = 0; x < matrix.length; x++) {
                    newMatrix[y][x] = matrix[M - x][y];
                }
            }
            
            matrix.length = 0;
            newMatrix.forEach(function(row) {
                matrix.push(row);
            });
            return matrix;
        }

        _.rotateMatrixToLeft = (matrix) => {
            var N = matrix[0].length - 1;
            var newMatrix = [];

            for (var y = 0; y < matrix[0].length; y++) {
                newMatrix.push([]);
                for (var x = 0; x < matrix.length; x++) {
                    newMatrix[y][x] = matrix[x][N - y];
                }
            }
            
            matrix.length = 0;
            newMatrix.forEach(function(row) {
                matrix.push(row);
            });
            return matrix;
        }

        _.blurBtn = (elem) => {
            if (!elem) return;
            setTimeout(function() {
                elem.blur();
            });
        }

        Array.prototype.clone = function() {
            return this.slice(0);
        };

        function PromiseQueue() {
            var _self = this;
            var _q = [];
            
            this.add = function () {
                var _qIndex = _q.length;
                _q.push(true);
                var killPromise = function () { _q[_qIndex] = false };
                return killPromise.bind(_self);
            };
            
            this.wait = function () {
                return new Promise(function (resolve) {
                (function waitLoop() {
                    for (var i = 0; i < _q.length; i++) {
                    if (_q[i]) return setTimeout(waitLoop, 10);
                    }
                    resolve();
                })();
                });
            };
        }

        function Pixel(x, y) {
            var _x = x;
            var _y = y;
            var _pixEl = document.getElementById("pixel-" + y + "-" + x);
            
            this.paint = function (color) {
                _pixEl.style.backgroundColor = color;
            };
            
            this.images = function(image) {
                _pixEl.style.backgroundImage = "url(/images/"+image+")";
            }
            
            this.erase = function () {
                _pixEl.style.backgroundColor = "";
            };
            
            this.addClass = function (className) {
                _pixEl.classList.add(className);
            };
            
            this.rmClass = function (className) {
                _pixEl.classList.remove(className);
            };
        }

        function Shape(typeName, matrix, colorIndex) {
            // General Props
            var _self = this;
            var _type = _.CONFIG.SHAPE_TYPES[typeName];
            var _name = typeName;
            var _colorIndex = colorIndex;
            var _color = _.CONFIG.COLOR_MAP[colorIndex];
            var _appended = false;

            // Matrix Private Props
            var _matrix = matrix.clone();
            var _height = _matrix.length;
            var _width = _matrix[0].length;
            var _x = Math.floor(_.CONFIG.table.cols / 2) - Math.floor(_width / 2);
            var _y = 0;

            // Private Functions
            function _canMove() {
                return !_appended && !_.IS_PAUSED;
            }

            function _changeMatrix(isRight) {
                _self.erase();
                if (isRight) {
                    _.rotateMatrixToRight(_matrix);
                } else {
                    _.rotateMatrixToLeft(_matrix);
                }
                _height = _matrix.length;
                _width = _matrix[0].length;
                _self.paint();
            }

            function _iterateOverPixels(cb) {
                for (var y = 0; y < _matrix.length; y++) {
                    for (var x = 0; x < _matrix[y].length; x++) {
                        if (!_matrix[y][x]) continue;
                        var pixelY = _y + y;
                        var pixelX = _x + x;
                        if (!cb(pixelX, pixelY)) return;
                    }
                }
            }

            function _iterateOverNewMatrixPixels(newMatrix, cb) {
                for (var y = 0; y < newMatrix.length; y++) {
                    for (var x = 0; x < newMatrix[y].length; x++) {
                        if (!newMatrix[y][x]) continue;
                        var pixelY = _y + y;
                        var pixelX = _x + x;
                        if (!cb(pixelX, pixelY)) return;
                    }
                }
            }

            function _canMoveTo(evalNextX, evalNextY) {
                var can = true;

                _iterateOverPixels(function (x, y) {
                    var nextX = evalNextX(x);
                    var nextY = evalNextY(y);

                    if (_.PIXEL_MATRIX[nextY + "-" + nextX]) {
                    return (can = false);
                    }
                    return true;
                });

                return can;
            }

            function _canRotateTo(isRight) {
                var can = true;
                var newMatrix = _matrix.clone();

                if (isRight) {
                    _.rotateMatrixToRight(newMatrix);
                } else {
                    _.rotateMatrixToLeft(newMatrix);
                }

                _iterateOverNewMatrixPixels(newMatrix, function (x, y) {
                    if (_.PIXEL_MATRIX[y + "-" + x]) {
                        return (can = false);
                    }
                    if (x >= _.CONFIG.table.cols) {
                        return (can = false);
                    }
                    if (y >= _.CONFIG.table.rows) {
                        return (can = false);
                    }
                    return true;
                });

                return can;
            }

            // Public Getter Functions
            this.getName = function () { return _name }
            this.getMatrix = function () { return _matrix.clone() }
            this.getColorIndex = function () { return _colorIndex }
            this.getX = function () { return _x }
            this.getY = function () { return _y }
            this.getWidth = function () { return _width }
            this.getHeight = function () { return _height }
            
            // Public Setter Functions
            this.setX = function (x) { _x = x }
            this.setY = function (y) { _y = y }

            // Other Public Functions
            this.paint = function () {
                _iterateOverPixels(function (x, y) {
                    if (x < 0 || y < 0) return true;
                    var pixel = new Pixel(x, y);

                    pixel.paint(_color);
                    pixel = null;
                    return true;
                });
            };

            this.erase = function () {
                _iterateOverPixels(function (x, y) {
                    if (x < 0 || y < 0) return true;
                    var pixel = new Pixel(x, y);

                    pixel.erase();
                    pixel = null;
                    return true;
                });
            };

            this.rotateRight = function () {
                if (!_canMove()) return;
                if (!_canRotateTo(true)) return;
                _changeMatrix(true);
            };

            this.rotateLeft = function () {
                if (!_canMove()) return;
                if (!_canRotateTo(false)) return;
                _changeMatrix(false);
            };

            this.moveLeft = function () {
                if (!_canMove()) return;
                if (_x === 0) return;
                if (!_canMoveTo(
                    function (x) { return x - 1 },
                    function (y) { return y }
                )) {
                    return;
                }
                _self.erase();
                _x--;
                _self.paint();
            };

            this.moveRight = function () {
                if (!_canMove()) return;
                if (_x + _width === _.CONFIG.table.cols) return;
                if (!_canMoveTo(
                    function (x) { return x + 1 },
                    function (y) { return y }
                )) {
                    return;
                }
                _self.erase();
                _x++;
                _self.paint();
            };

            this.moveDown = function (stopCb) {
                if (!_canMove()) return;
                if (
                    _y + _height === _.CONFIG.table.rows
                    ||
                    !_canMoveTo(
                    function (x) { return x },
                    function (y) { return y + 1 }
                    )) {
                    _appended = true;
                    stopCb();
                    return;
                }
                _self.erase();
                _y++;
                _self.paint();
            };

            this.appendToTable = function () {
                _appended = true;
                _iterateOverPixels(function(x, y) {
                    _.PIXEL_MATRIX[y + "-" + x] = _colorIndex;
                    return true;
                });
            };
            
            this.isDrawable = function () {
                var drawable = true;
                
                _iterateOverPixels(function (x, y) {
                    if (_.PIXEL_MATRIX[y + "-" + x]) return (drawable = false);
                    if (x >= _.CONFIG.table.cols) return (drawable = false);
                    if (y >= _.CONFIG.table.rows) return (drawable = false);
                    return true;
                });
                
                return drawable;
            };
            
        }

        _.TABLE = new (function () {
            var _self = this;
            var _elem = document.getElementById("game-table");

            // Private Functions
            function _iterateRowPixels(y, cb) {
                for (var x = 0; x < _.CONFIG.table.cols; x++) {
                    if (!cb(x, y)) return;
                }
            }

            function _iterateAllPixels(cb) {
                for (var y = 0; y < _.CONFIG.table.rows; y++) {
                    for (var x = 0; x < _.CONFIG.table.cols; x++) {
                        if (!cb(x, y)) return;
                    }
                }
            }

            function _countBottomEmptyRows(y) {
                var count = 0;
                y++;
                for (; y < _.CONFIG.table.rows; y++) {
                    if (_self.isRowEmpty(y)) {
                        count++;
                    }
                }
                return count;
            }

            function _eraseRowAnimated(y) {
                return new Promise(function (resolve, reject) {
                    var x = 0;
                    (function erasePixel(x) {
                        var pixel = new Pixel(x, y);

                        pixel.erase();
                        delete _.PIXEL_MATRIX[y + "-" + x];

                        if (x === _.CONFIG.table.cols - 1) {
                            return resolve();
                        }

                        setTimeout(erasePixel, _.CONFIG.resolve.speed, ++x);
                    })(x);
                });
            }

            function _putPixelDownAnimated(x, y, bottomEmptyRows) {
                return new Promise(function (resolve) {
                    (function anim(x, y) {
                        var nextY = y + 1;

                        if (!bottomEmptyRows && !_.CONFIG.block.fragile) {
                            return resolve();
                        }
                        if (_.PIXEL_MATRIX[nextY + "-" + x]) {
                            return resolve();
                        }
                        if (nextY > _.CONFIG.table.rows - 1) {
                            return resolve();
                        }

                        bottomEmptyRows--;
                        var pixel = new Pixel(x, y);
                        var nextPixel = new Pixel(x, nextY);
                        var colorIndex = _.PIXEL_MATRIX[y + "-" + x];

                        pixel.erase();
                        delete _.PIXEL_MATRIX[y + "-" + x];

                        nextPixel.paint(_.CONFIG.COLOR_MAP[colorIndex]);
                        _.PIXEL_MATRIX[nextY + "-" + x] = colorIndex;

                        setTimeout(anim, _.CONFIG.gravity.speed, x, nextY);
                    })(x, y);
                });
            }

            function _gravityOnAnimated(y) {
                return new Promise(function (resolve) {
                    var promiseQ = new PromiseQueue();
                    var bottomEmptyRows = _countBottomEmptyRows(y);

                    for (; y > 0; y--) {
                    if (_self.isRowEmpty(y)) break;
                    if (y + 1 === _.CONFIG.table.rows) continue;
                    
                    for (var x = 0; x < _.CONFIG.table.cols; x++) {
                        var killPromise = promiseQ.add();
                        _putPixelDownAnimated(x, y, bottomEmptyRows).then(killPromise);
                    }
                    }

                    promiseQ.wait().then(resolve);
                });
            }

            function _resolveRow(y) {
                return new Promise(function (resolve) {
                    _eraseRowAnimated(y)
                    .then(function () {
                        setTimeout(function () {
                        _gravityOnAnimated(--y)
                            .then(function () {
                            if (!_.CONFIG.block.fragile) {
                                return resolve(0);
                            }
                            _self.checkForResolvableRows(false)
                                .then(resolve);
                            });
                        }, _.CONFIG.gravity.delay);
                    });
                });
            }

            // Public Functions
            this.show = function () {
                _elem.style.display = "block"
            };

            this.hide = function () {
                _elem.style.display = "none";
            };

            this.isRowEmpty = function (y) {
                var empty = true;

                _iterateRowPixels(y, function (x) {
                    return _.PIXEL_MATRIX[y + "-" + x]
                    ? (empty = false)
                    : true;
                });

                return empty;
            };

            this.isRowFull = function (y) {
                var full = true;

                _iterateRowPixels(y, function (x) {
                    return _.PIXEL_MATRIX[y + "-" + x]
                    ? true
                    : (full = false);
                });

                return full;
            };

            this.iterateRowPixels = _iterateRowPixels;

            this.eraseAll = function () {
                _iterateAllPixels(function (x, y) {
                    (new Pixel(x, y)).erase();
                    delete _.PIXEL_MATRIX[y + "-" + x];
                    return true;
                });
            };

            this.checkForResolvableRows = function (changeCalcFlag) {
                return new Promise(function (resolve) {
                    if (changeCalcFlag === undefined) {
                        changeCalcFlag = true;
                    }
                    var rows = _.CONFIG.table.rows;
                    var promiseQ = new PromiseQueue();
                    var resolvableRowsCount = 0;
                    var resolvedRowsCount = 0;

                    for (var y = rows - 1; y > -1; y--) {
                        if (_self.isRowEmpty(y)) {
                            break;
                        }
                        if (!_self.isRowFull(y)) {
                            continue;
                        }

                        if (changeCalcFlag) _.IS_CALCING = true;
                        resolvableRowsCount++;

                        var killPromise = promiseQ.add();
                        _resolveRow(y).then((function(killPromise) {
                            return function (resRowsCount) {
                                resolvedRowsCount += 1 + resRowsCount;
                                killPromise();
                            };
                        })(killPromise));
                    }

                    if (resolvableRowsCount) {
                        _.SCORE.add(
                            resolvableRowsCount * _.CONFIG.resolve.price
                        );
                    }

                    promiseQ.wait().then(function () {
                        if (changeCalcFlag) _.IS_CALCING = false;
                        resolve(resolvedRowsCount);
                    });
                });
            };
        })();

        _.SCORE = new (function() {
            var _self = this;
            var _elem = null;
            var _score = 0;
            var _isAnimating = false;

            // Private Functions
            function _showScore(num) {
                _elem.innerHTML = num || _score;
            }

            function _getShownScore() {
                return Number(_elem.innerText);
            }

            function _addScoreAnimated() {
                setTimeout(function () {
                    if (!_isAnimating) return;

                    var shownScore = _getShownScore();
                    _showScore(++shownScore);

                    if (shownScore === _score) {
                        _isAnimating = false;
                        return;
                    }

                    _addScoreAnimated();
                }, 10);
            }

            // Public Functions
            this.init = function() {
                _elem = document.getElementById("game-points-num");
            };

            this.add = function (num) {
                _score += num;
                if (_isAnimating) return;
                _isAnimating = true;
                window.localStorage.tetrixBestScore < _score && (window.localStorage.tetrixBestScore = _score);
                _addScoreAnimated();
            };

            this.reset = function () {
                _isAnimating = false;
                _score = 0;
                _showScore();
            };

            this.get = function () {
                return _score;
            };
        })();

        _.NEXT = new (function () {
            var _self = this;
            var _shapeIdPrefix = "next-piece-shape-";
            var _pixelSize = 12; // in pixels
            
            var _nextElem = null;
            var _shapeStack = {};
            var _firstShapeId = 0;
            var _lastShapeId = 0;
            
            // Private Functions
            function _makeShapeId(shapeNum) {
                return _shapeIdPrefix + shapeNum;
            }
            
            function _iterateShapeAllPixels (shape, cb) {
                var width = shape.getWidth();
                var height = shape.getHeight();
                
                for (var y=0; y < height; y++) {
                    for (var x=0; x < width; x++) {
                        if (!cb(x, y)) return;
                    }
                }
            }
            
            function _addShapeElemPixels (shape, shapeElem) {
                var matrix = shape.getMatrix();
                var colorIndex = shape.getColorIndex();
                
                _iterateShapeAllPixels(shape, function (x, y) {
                    var div = document.createElement("div");
                    div.classList.add("game-next-shape-pixel");
                    div.style.backgroundColor = _.CONFIG.COLOR_MAP[colorIndex];
                    if (!matrix[y][x]) div.style.opacity = 0;
                    shapeElem.appendChild(div);
                    return true;
                });
            }
            
            function _addShapeElem (shape, id) {
                var shapeElem = document.createElement("div");
                var shapeWidth = (shape.getWidth() * _pixelSize) + "px";
                var shapeHeight = (shape.getHeight() * _pixelSize) + "px";
                
                shapeElem.setAttribute("id", id);
                shapeElem.classList.add("game-next-shape");
                shapeElem.style.width = shapeWidth;
                shapeElem.style.height = shapeHeight;
                
                _addShapeElemPixels(shape, shapeElem);
                
                _nextElem.appendChild(shapeElem);
            }
            
            function _rmFirstShapeElem () {
                var firstShapeElem = document.getElementById(
                    _makeShapeId(_firstShapeId)
                );
                _nextElem.removeChild(firstShapeElem);
            }
            
            function _rmAllShapeElems () {
                for (var shapeElemId in _shapeStack) {
                    var shapeElem = document.getElementById(shapeElemId);
                    _nextElem.removeChild(shapeElem);
                }
            }
            
            // Public Functions
            this.init = function () {
                _nextElem = document.getElementById("game-next");
            };
            
            this.push = function (shape) {
                var id = _makeShapeId(_lastShapeId++);
                _shapeStack[id] = shape;
                _addShapeElem(shape, id);
            };
            
            this.pop = function () {
                var id = _makeShapeId(_firstShapeId);
                var shape = _shapeStack[id];
                delete _shapeStack[id];
                _rmFirstShapeElem();
                _firstShapeId++;
                return shape;
            };
            
            this.empty = function () {
                _rmAllShapeElems();
                _shapeStack = {};
                _firstShapeId = 0;
                _lastShapeId = 0;
            };
        })();

        _.LOADING = new (function() {
            var _isLoading = true;
            var _elem = null;

            this.isLoading = function () {
                return _isLoading;
            };

            this.init = function () {
                _elem = document.getElementById("game-loading-overlay");
            };

            this.endLoading = function () {
                _isLoading = false;
                _elem.classList.add("game-loading-fading-out");
                setTimeout(function() {
                    _elem.style.display = "none";
                    document.getElementById("dialog-container").classList.remove("-hide-dialog");
                }, 1000);
            };
        })();

        _.LIFE = new (function () {
            var _self = this;
            var _elem = null;
            var _lives = 0;

            // Private Functions
            function _showLives(num) {
                _elem.innerHTML = num || _lives;
            }

            // Public Functions
            this.init = function () {
                _elem = document.getElementById("game-lives-num");
                _lives = _.CONFIG.start.lives;
                _showLives();
            };

            this.reduce = function () {
                if (!_lives) return;
                _showLives(--_lives);
            };

            this.reset = function () {
                _lives = _.CONFIG.start.lives;
                _showLives();
            };

            this.get = function () {
                return _lives;
            };
        })();

        _.HOLD = new (function() {
            var _self = this;
            var _pixelIdPrefix = "hold-pixel-";
            
            var _shape = null;
            var _matrix = null;
            var _width = null;
            var _height = null;
            var _x = 0;
            var _y = 0;
            var _colorIndex = null;
            var _isLocked = false;
            
            var _tableElem = null;
            var _lockIcon = null;
            var _cellSize = 12; // in pixels
            
            // Private Functions
            function _getPixelId(x, y) {
                return _pixelIdPrefix + y + "-" + x;
            }
            
            function _makePixel(x, y) {
                var div = document.createElement("div");
                div.classList.add("game-hold-table-pixel");
                div.setAttribute("id", _getPixelId(x, y));
                return div;
            }
            
            function _registerShape(shape) {
                _shape = shape;
                _matrix = shape.getMatrix();
                _width = shape.getWidth();
                _height = shape.getHeight();
                _x = _width !== 4 ? 1 : 0;
                _y = _height !== 4 ? 1 : 0;
                _colorIndex = shape.getColorIndex();
            }
            
            function _iterateTablePixels(cb) {
                for (var y=0; y < _height; y++) {
                    for (var x=0; x < _width && cb(x++, y);)
                    ;
                }
            }
            
            function _iterateMatrixPixels(cb) {
                for (var y=0; y < _height; y++) {
                    for (var x=0; x < _width; x++) {
                        if (!_matrix[y][x]) continue;
                        if (!cb(x, y)) return;
                    }
                }
            }
            
            function _getPixEl(x, y) {
                return document.getElementById(_getPixelId(x, y));
            }
            
            function _erasePixel(x, y) {
                _getPixEl(x, y).style.backgroundColor = "";
            }
            
            function _paintPixel(x, y, colorIndex) {
                var pixEl = _getPixEl(x, y);
                pixEl.style.backgroundColor = _.CONFIG.COLOR_MAP[colorIndex];
            };
            
            function _eraseTable() {
                _iterateTablePixels(function(x, y) {
                    _erasePixel(x, y);
                    return true;
                });
            }
            
            function _removeTablePixels() {
                while (_tableElem.firstChild) {
                    _tableElem.removeChild(_tableElem.firstChild);
                }
            }
            
            function _makeShapeTable() {
                var tabWidth = _width * _cellSize;
                var tabHeight = _height * _cellSize;
                
                _tableElem.style.width = tabWidth + "px";
                _tableElem.style.height = tabHeight + "px";
                
                for (var y=0; y < _height; y++) {
                    for (var x=0; x < _width; x++) {
                        var pixEl = _makePixel(x, y);
                        if (!_matrix[y][x]) pixEl.style.opacity = 0;
                        _tableElem.appendChild(pixEl);
                    }
                }
            }
            
            function _drawShape() {
                _removeTablePixels();
                _makeShapeTable();
                _iterateMatrixPixels(function(x, y) {
                    _paintPixel(x, y, _colorIndex);
                    return true;
                });
            }
            
            function _lock() {
                _isLocked = true;
                _lockIcon.style.display = "inline-block";
            }
            
            function _unlock() {
                _isLocked = false;
                _lockIcon.style.display = "none";
            }
            
            // Public Functions
            this.init = function() {
                _tableElem = document.getElementById("game-hold-table");
                _lockIcon = document.getElementById("game-hold-lock");
                _unlock();
            };
            
            this.getShape = function () { return _shape };
            
            this.hold = function (shape) {
                if (_isLocked) return;
                _registerShape(shape);
                _drawShape();
            };
            
            this.lock = _lock;
            this.unlock = _unlock;
            this.isLocked = function () { return _isLocked };
            
            this.empty = function () {
                _shape = null;
                _removeTablePixels();
                _unlock();
            };
            
        })();

        _.GENERAL_STATUS = new (function GenStatus() {
            var _elem = document.getElementById("game-status");
            var _text = _.CONFIG.start.text;

            _elem.innerHTML = _text;

            this.start = function () {
                _elem.innerHTML = _.CONFIG.start.text;
            };

            this.resume = function () {
                _elem.innerHTML = _.CONFIG.resume.text;
            };

            this.pause = function () {
                _elem.innerHTML = _.CONFIG.pause.text;
            };

            this.tryAgain = function () {
                _elem.innerHTML = _.CONFIG.tryAgain.text;
            };

            this.gameOver = function () {
                _elem.innerHTML = _.CONFIG.over.text;
            };
        })();

        _.GAME = new (function () {
            var _self = this;
            var _handShape = null; // Shape Obj
            var _frameRate = _.CONFIG.start.speed; // in milliseconds
            var _speedFrameRate = 40; // in milliseconds
            var _isSpeed = false;
            var _lastColorIndex = null;
            var _mainFrameTimeout = null;

            var _tableElem = null;
            var _pauseBtnIconElem = null;

            // Private Functions
            function _setMainTimeout(cb, frameRate) {
                _mainFrameTimeout = setTimeout(cb, frameRate);
            }

            function _stopCallback() {
                _handShape.appendToTable();
                if (!_.TABLE.isRowEmpty(0)) return _gameOver();
                _.TABLE.checkForResolvableRows()
                .then(function(resolvedRowsCount) {
                    _self.getNewShape();
                    _.HOLD.unlock();
                    if (_frameRate <= _speedFrameRate) return;
                    _frameRate -= resolvedRowsCount * 10;
                });
            }

            function _gameOver() {
                _.GAME_OVER = true;
                _.LIFE.reduce();
                if (_.LIFE.get()) {
                    _.GENERAL_STATUS.tryAgain();
                    return;
                }
                _.GENERAL_STATUS.gameOver();
                _.endGamePan();
                _frameRate = _.CONFIG.start.speed;
            }

            function _makePixel(x, y) {
                var div = document.createElement("div");
                div.classList.add("game-table-pixel");
                div.setAttribute("id", "pixel-" + y + "-" + x);
                div.style.width = div.style.height = _.CONFIG.pixel.size + "px";
                return div;
            }

            function _getRandomShape() {
                var typeName = _getRandomTypeName();
                var type = _.CONFIG.SHAPE_TYPES[typeName];
                var matrix = _getRandomMatrix(type);
                var colorIndex = null;

                if (_.CONFIG.block.staticColor) {
                    colorIndex = type.color;
                } else {
                    (function getNonRepetitiveColor() {
                        colorIndex = _getRandomColorIndex();
                        if (Object.keys(_.CONFIG.COLOR_MAP).length === 1) return;
                        if (colorIndex === _lastColorIndex) {
                            getNonRepetitiveColor();
                        }
                    })();
                }

                _lastColorIndex = colorIndex;

                return new Shape(typeName, matrix, colorIndex);
            }

            function _getRandomTypeName() {
                var typesArr = Object.keys(_.CONFIG.SHAPE_TYPES);
                return _.getRandomIndex(typesArr);
            }

            function _getRandomMatrix(type) {
                var matrix = type.matrix.clone();
                var randomNum = Math.floor(
                    Math.random() * 4
                ) + 1;

                while(randomNum--) _.rotateMatrixToRight(matrix);
                return matrix;
            }

            function _getRandomColorIndex() {
                return _.getRandomPropName(_.CONFIG.COLOR_MAP);
            }

            // Public Functions
            this.init = function () {
                // Load Elements
                _tableElem = document.getElementById("game-table");
                _pauseBtnIconElem = document.querySelector("#game-toggle-pause-btn .fa");

                var tableCols = _.CONFIG.table.cols;
                var tableRows = _.CONFIG.table.rows;
                var pixelSize = _.CONFIG.pixel.size;

                _tableElem.style.width = (tableCols * pixelSize) + 4 + "px";
                _tableElem.style.height = (tableRows * pixelSize) + 4 + "px";

                for (var y = 0; y < tableRows; y++) {
                    for (var x = 0; x < tableCols; x++) {
                        var pixel = _makePixel(x, y);
                        _tableElem.appendChild(pixel);
                    }
                }

                // Paint The Danger Row
                _.TABLE.iterateRowPixels(0, function (x) {
                    var pixel = new Pixel(x, 0);
                    pixel.addClass("game-danger-row-pixel");
                    return true;
                });

                _.TABLE.show();
                _.NEXT.push(_getRandomShape());

                // Currect the toggler button icon

                _.LOADING.endLoading();
            }

            this.renderFrame = function () {
                var gameFrameRate = _isSpeed ? _speedFrameRate : _frameRate;

                if (_.IS_PAUSED || _.IS_CALCING) {
                    _setMainTimeout(_self.renderFrame, gameFrameRate);
                    return;
                }

                _handShape.moveDown(_stopCallback);
                _setMainTimeout(_self.renderFrame, gameFrameRate);
            }

            this.getNewShape = function () {
                _handShape = _.NEXT.pop();
                _.NEXT.push(_getRandomShape());
                _handShape.paint();
            };

            this.resume = function () {
                _.IS_PAUSED = false;
                _.GENERAL_STATUS.resume();
                _pauseBtnIconElem.classList.add("fa-pause");
                _pauseBtnIconElem.classList.remove("fa-play");
            };

            this.pause = function () {
                _.IS_PAUSED = true;
                _.GENERAL_STATUS.pause();
                _pauseBtnIconElem.classList.add("fa-play");
                _pauseBtnIconElem.classList.remove("fa-pause");
            };

            this.togglePause = function () {
                if (_.GAME_OVER) return;
                _.IS_PAUSED ? _self.resume() : _self.pause();
            };

            this.speedItUp = function () {
                if (_isSpeed) return;
                _isSpeed = true;
                clearTimeout(_mainFrameTimeout);
                _self.renderFrame();
            };

            this.speedItDown = function () {
                if (!_isSpeed) return;
                _isSpeed = false;
                clearTimeout(_mainFrameTimeout);
                _self.renderFrame();
            };

            this.restart = function () {
                _.GAME_OVER = false;
                _.TABLE.eraseAll();
                if (!_.LIFE.get()) {
                    _.SCORE.reset();
                    _.LIFE.reset();
                }
                _.HOLD.empty();
                _.NEXT.empty();
                _.NEXT.push(_getRandomShape());
                _self.getNewShape();
                _self.resume();
            };

            this.backToStart = function () {
                _.GAME_OVER = false;
                _self.pause();
                _.GENERAL_STATUS.start();
                _.TABLE.eraseAll();
                _.SCORE.reset();
                _.LIFE.reset();
                _.HOLD.empty();
                _.NEXT.empty();
                _.NEXT.push(_getRandomShape());
                _frameRate = _.CONFIG.start.speed;
                _self.getNewShape();
            };

            this.moveRight = function () {
                if (!_handShape) return;
                _handShape.moveRight();
            };

            this.moveLeft = function () {
                if (!_handShape) return;
                _handShape.moveLeft();
            };

            this.rotateRight = function () {
                if (!_handShape) return;
                _handShape.rotateRight();
            }

            this.rotateLeft = function () {
                if (!_handShape) return;
                _handShape.rotateLeft();
            };
            
            this.hold = function () {
                if (_.HOLD.isLocked()) return;
                var holdShape = _.HOLD.getShape();
                if (!holdShape) holdShape = _getRandomShape();
                holdShape.setX(_handShape.getX());
                holdShape.setY(_handShape.getY());
                if (!holdShape.isDrawable()) return;
                _handShape.erase();
                _.HOLD.hold(_handShape);
                _.HOLD.lock();
                _handShape = holdShape;
                _handShape.paint();
            };

        })();

        _.toggleGamePause = () => {
            var iconElem = document.querySelector("#game-toggle-pause-btn > .fa");

            _.GAME.togglePause();
            iconElem.classList[_.IS_PAUSED ? "add" : "remove"]("fa-play");
            iconElem.classList[_.IS_PAUSED ? "remove" : "add"]("fa-pause");
            _.blurBtn(this);
        }

        _.restartGame = () => {
            _.GAME.backToStart();
            _.endGamePan();
        }

        _.startGame = () => {
            _.GAME.backToStart();
            _.CONFIG.block.fragile = false;
            document.getElementById("dialog-container").classList.add("-hide-dialog");
            _.IS_PLAYING = true;
            _.toggleGamePause();
        }
        
        _.startGameEasy = () => {
            _.GAME.backToStart();
            _.CONFIG.block.fragile = true;
            document.getElementById("dialog-container").classList.add("-hide-dialog");
            _.IS_PLAYING = true;
            _.toggleGamePause();
        }
        
        _.endGamePan = () => {
            _.IS_PLAYING = false;
            document.getElementById("best-score-indi").innerText = window.localStorage.tetrixBestScore || 0;
            document.getElementById("dialog-container").classList.remove("-hide-dialog");
        }

        _.GameInit = () => {
            _.LOADING.init();
            _.SCORE.init();
            _.LIFE.init();
            _.HOLD.init();
            _.NEXT.init();
            _.GAME.init();
            _.GAME.getNewShape();
            _.GAME.renderFrame();
                
            window.onkeydown = function (e) {
                if (_.LOADING.isLoading()) return;
                
                // Other keys
                switch(e.keyCode) {
                    case _.keys.KEY_ENTER:
                        if (_.GAME_OVER && _.LIFE.get()) return _.GAME.restart();
                        if (_.IS_PLAYING) _.toggleGamePause();
                        break;
                }
                
                if (_.IS_PAUSED) return;
                
                // Game Keys
                switch (e.keyCode) {
                    case _.keys.KEY_A:
                    case _.keys.KEY_LEFT:
                    _.GAME.moveLeft();
                    break;
                    case _.keys.KEY_D:
                    case _.keys.KEY_RIGHT:
                    _.GAME.moveRight();
                    break;
                    case _.keys.KEY_E:
                    case _.keys.KEY_W:
                    case _.keys.KEY_UP:
                    _.GAME.rotateRight();
                    break;
                    case _.keys.KEY_Q:
                    _.GAME.rotateLeft();
                    break;
                    case _.keys.KEY_S:
                    case _.keys.KEY_DOWN:
                    _.GAME.speedItUp();
                    break;
                    case _.keys.KEY_CTRL:
                    _.GAME.hold();
                    break;
                }
            };
                
            window.onkeyup = function (e) {
                if (_.IS_PAUSED || _.LOADING.isLoading()) return;
                // Game keys
                switch (e.keyCode) {
                    case _.keys.KEY_S:
                    case _.keys.KEY_DOWN:
                    _.GAME.speedItDown();
                    break;
                }
            };

            document.getElementById("game-toggle-pause-btn").onclick = () => {
                _.toggleGamePause();
            }
            document.getElementById("game-restart-btn").onclick = () => {
                _.restartGame();
            }
            document.getElementById("start-btn").onclick = _.startGame;
            document.getElementById("start-easy-btn").onclick = _.startGameEasy;

            !window.localStorage.tetrixBestScore && (window.localStorage.tetrixBestScore = 0)
            document.getElementById("best-score-indi").innerText = window.localStorage.tetrixBestScore || 0;
        }

        (function(){
            window.setTimeout(() => {
                _.GameInit();
            }, 0);
        }());
    } catch (error) {
        console.info(error);
    }
}(this.gref_));