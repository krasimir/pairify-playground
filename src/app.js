const pairify = require('pairify');

const $ = sel => document.querySelector(sel);
let editor;

const CODE = `function getAnswer(answer = { value: 42 }) {
  return "The answer is " + answer.value;
}
console.log(getAnswer({ value: 100 }));`;

function analyze() {
  $('.tokens').innerHTML = '<ul>' + pairify
    .analyze(editor.getValue())
    .map((pair, idx) => {
      return `
        <a href="javascript:void(0)" data-pair="${idx}"><strong>${pair.type}</strong> ${pair.from[0]}:${pair.from[1]} ― ${pair.to[0]}:${pair.to[1]}</a>
      `;
    })
    .map(link => `<li>${link}</li>`).join('') + '</ul>';
}


window.onload = function () {
  editor = CodeMirror.fromTextArea($('.editor textarea'), {
    lineNumbers: true
  });
  editor.on('change', analyze);
  editor.on('cursorActivity', () => {
    const { line, ch } = editor.getCursor();
    $('.cursor').innerHTML = `${line+1}:${ch+1}`;
  });
  
  $('.tokens').addEventListener('mouseover', event => {
    const pairs = pairify.analyze(editor.getValue());
    const pairIdx = event.target.getAttribute('data-pair');
    if (pairIdx) {
      const pair = pairs[parseInt(pairIdx)];
      editor.setSelection(
        { line: pair.from[0]-1, ch: pair.from[1]-1 },
        { line: pair.to[0]-1, ch: pair.to[1]-1 }
      );
    }
  });

  editor.setValue(CODE);
  analyze();
}