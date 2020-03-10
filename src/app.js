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
}`;
let currentPairs = [];

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
  $('.tokens').innerHTML = '<ul>' + 
    currentPairs
    .map((pair, idx) => {
      return `
        <a href="javascript:void(0)" data-pair="${idx}"><strong>${pair.type}</strong> <small>${pair.from[0]}:${pair.from[1]} ― ${pair.to[0]}:${pair.to[1]}</small></a>
      `;
    })
    .map(link => `<li>${link}</li>`).join('') + '</ul>';
}


window.onload = function () {
  editor = CodeMirror.fromTextArea($('.editor textarea'), {
    lineNumbers: true,
    viewportMargin: Infinity,
    lineWrapping: true
  });
  editor.on('change', analyze);
  editor.on('cursorActivity', () => {
    const { line, ch } = editor.getCursor();
    $('.cursor').innerHTML = `${line+1}:${ch+1}`;
  });
  editor.on('focus', () => {
    $('.cursor').style.display = 'block';
  });
  editor.on('blur', () => {
    $('.cursor').style.display = 'none';
  });
  
  $('.tokens').addEventListener('mouseover', event => {
    const pairIdx = event.target.getAttribute('data-pair');
    if (pairIdx) {
      const pair = currentPairs[parseInt(pairIdx)];
      if (pair) {
        editor.setSelection(
          { line: pair.from[0]-1, ch: pair.from[1]-1 },
          { line: pair.to[0]-1, ch: pair.to[1]-1 }
        );
      } else {
        console.warn(`Pair with index ${pairIdx} not found!`)
      }
    }
  });

  editor.setValue(CODE);
  analyze();
}