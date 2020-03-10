(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Pairify = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const CATEGORY_COMMENT = 'comment';
const CATEGORY_STRING = 'string';
const CATEGORY_BLOCK = 'block';
const COMMENTS = [
  { type: 'comment-single-line', start: '//', end: '\n ', category: CATEGORY_COMMENT },
  { type: 'comment-block', start: '/*', end: '*/', category: CATEGORY_COMMENT }
]
const STRINGS = [
  { type: 'single-quotes', start: '\'', end: '\'', category: CATEGORY_STRING },
  { type: 'double-quotes', start: '"', end: '"', category: CATEGORY_STRING },
  { type: 'template-literal', start: '`', end: '`', category: CATEGORY_STRING }
]
const BLOCKS = [
  { type: 'round', start: '(', end: ')', category: CATEGORY_BLOCK },
  { type: 'curly', start: '{', end: '}', category: CATEGORY_BLOCK },
  { type: 'square', start: '[', end: ']', category: CATEGORY_BLOCK },
  { type: 'angle', start: '<', end: '>', category: CATEGORY_BLOCK }
]
const ALL = COMMENTS.concat(STRINGS, BLOCKS);
const NEW_LINE = '\n';

function match(token, line, position, cursor) {
  return {
    token,
    line,
    position,
    cursor
  }
}
function pair(type, from, to, body) {
  return {
    type,
    from: [ from.line, from.position ],
    to: [ to.line, to.position ],
    body: [body[0], body[1] - body[0]]
  }
}
function analyze(code) {
  let line = 1;
  let stack = [];
  let finds = [];
  let starters = ALL.reduce((res, token) => {
    res[token.start] = token;
    return res;
  }, {});
  let enders = ALL.reduce((res, token) => {
    res[token.end] = token;
    return res;
  }, {});
  
  let position = 0;
  for(let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];
    const prevChar = code[i - 1];
    const starter = starters[char] || starters[char + nextChar] || null;
    const ender = enders[char] || enders[char + nextChar] || null;

    if (char === NEW_LINE) {
      // searching for a single line comment closing
      for(let j = stack.length-1; j >= 0; j--) {
        if (stack[j].token.type === 'comment-single-line') {
          const s = stack[j];
          stack.splice(j);
          finds.push(
            pair(
              'comment-single-line',
              { line: s.line, position: s.position },
              { line: line, position: position + 1 },
              [s.cursor, i + 1]
            )
          );
          break;
        }
      }
      line += 1;
      position = 0;

    } else {
      position += 1;
      if (stack.length > 0) {
        if (ender) {
          let foundInStack = false;
          let inStringOrComment = false;
          // walking back the stack
          for(let j = stack.length-1; j >= 0; j--) {
            if (
              stack[j].token.category === CATEGORY_COMMENT ||
              stack[j].token.category === CATEGORY_STRING
            ) {
              inStringOrComment = true;
            }
            // This is a patch for the cases where we have a fat arrow
            // as a JSX attribute. For example:
            // <button onClick={() => setCount(count + 1)}>
            if (ender.type === 'angle' && prevChar === '=') {
              break;
            }
            if (ender.type === stack[j].token.type) {
              foundInStack = true;
              if (ender.category === CATEGORY_BLOCK && inStringOrComment) {
                break;
              }
              const s = stack[j];
              stack.splice(j);
              // registering a result
              finds.push(
                pair(
                  ender.type,
                  { line: s.line, position: s.position },
                  { line: line, position: position + ender.end.length },
                  [s.cursor, i + 1]
                )
              );
              break;
            }
          }
          if (!foundInStack && starter !== null) {
            stack.push(match(starter, line, position, i));  
          }
        } else if (starter !== null) {
          stack.push(match(starter, line, position, i));
        }
      } else {
        if (starter !== null) {
          stack.push(match(starter, line, position, i));
        }
      }
    }
  }

  return finds;
}

function matchPairs(code, line, position) {
  return analyze(code)
    .filter(pair => {
      if (line > pair.from[0] && line < pair.to[0]) {
        return true;
      } else if (pair.from[0] === pair.to[0] && pair.from[0] === line) {
        return position > pair.from[1] && position <= pair.to[1];
      } else if (line === pair.from[0]) {
        return position >= pair.from[1];
      } else if (line === pair.to[0]) {
        return position < pair.to[1];
      }
      return false;
    })
}

module.exports = {
  analyze,
  match: matchPairs
}
},{}]},{},[1])(1)
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
const pairify = require('pairify');

const $ = sel => document.querySelector(sel);
let editor;

const CODE = `import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    document.title = \`You clicked \${count} times\`;
  });

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

function printAnswer(answer) {
  console.log(\`The answer is: \${answer}\`);
}`;
let currentPairs = [];
let currentScopeMarker = null;
let markScope = true;

function analyze() {
  const pairs = pairify.analyze(editor.getValue());
  const pairsByType = pairs.reduce((res, pair) => {
    if (!res[pair.type]) res[pair.type] = [];
    res[pair.type].push(pair);
    return res;
  }, {});
  currentPairs = Object.keys(pairsByType)
  .reduce((res, type) => {
    return res.concat(pairsByType[type]);
  }, []);
  $('.tokens .links').innerHTML = '<ul>' + 
    currentPairs
    .map((pair, idx) => {
      return `
        <a href="javascript:void(0)" onMouseOver="javascript:pairOver(${idx})"><strong>${pair.type}</strong> <small>${pair.from[0]}:${pair.from[1]} ― ${pair.to[0]}:${pair.to[1]}</small></a>
      `;
    })
    .map(link => `<li>${link}</li>`).join('') + '</ul>';
}

window.pairOver = (pairIdx) => {
  const pair = currentPairs[parseInt(pairIdx)];
  if (pair) {
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
    currentScopeMarker = editor.markText(
      { line: pair.from[0]-1, ch: pair.from[1]-1 },
      { line: pair.to[0]-1, ch: pair.to[1]-1 },
      { className: 'pairify-pair' }
    )
  } else {
    console.warn(`Pair with index ${pairIdx} not found!`)
  }
}

window.onload = function () {
  let focused = false;
  function onCursorActivity() {
    if (focused) {
      const { line, ch } = editor.getCursor();
      $('.cursor').innerHTML = `${line+1}:${ch+1}`;
      
      const matchingPairs = pairify.match(editor.getValue(), line+1, ch+1).filter(({ type }) => type === 'curly');
      if (currentScopeMarker) {
        currentScopeMarker.clear();
      }
      if (matchingPairs.length > 0 && markScope) {
        const {from, to} = matchingPairs.pop();
        currentScopeMarker = editor.markText(
          { line: from[0]-1, ch: from[1]-1 },
          { line: to[0]-1, ch: to[1]-1 },
          { className: 'pairify-scope' }
        )
      }
    }
  }
  editor = CodeMirror.fromTextArea($('.editor textarea'), {
    lineNumbers: true,
    viewportMargin: Infinity,
    lineWrapping: true,
    mode: 'jsx'
  });
  editor.on('change', analyze);
  editor.on('cursorActivity', onCursorActivity);
  editor.on('focus', () => {
    focused = true;
    $('.cursor').style.display = 'block';
    setTimeout(onCursorActivity, 1);
  });
  editor.on('blur', () => {
    focused = false;
    $('.cursor').style.display = 'none';
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
  });

  $('input[type="checkbox"]').addEventListener('change', () => {
    markScope = !markScope;
    if (currentScopeMarker) {
      currentScopeMarker.clear();
    }
  });

  editor.setValue(CODE);
  analyze();
}
},{"pairify":1}]},{},[2]);
