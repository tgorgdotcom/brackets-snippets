Imitate snippets feature of Sublime Text, and bring it to Brackets.

## Screen demo
![brackets-snippets-demo.gif](http://edwardchu.org/assets/images/brackets-snippets-demo.gif "Demo gif of the extension")
> Gif size ~500kb, please wait until loaded

## Features
1. Insert snippets by pressing `Tab` key
2. Multiple variables support
3. Select next variables by pressing `Tab` key
4. Edit multiple variables one time

## Default snippets
### Javascript
> Snippets from [zenorocha/sublime-javascript-snippets](https://github.com/zenorocha/sublime-javascript-snippets)

#### Console
- [cl] console.log
    ```
    console.log(${1:obj});${2}
    ```

- [cd] console.dir
    ```
    console.dir(${1:obj});${2}
    ```

- [ce] console.error
    ```
    console.error(${1:obj});${2}
    ```

- [cll] console.log
    ```
    console.log('${1:obj}:', ${1:obj});${2}
    ```

- [cdd] console.dir
    ```
    console.dir('${1:obj}:', ${1:obj});${2}
    ```

- [cee] console.error
    ```
    console.error('${1:obj}:', ${1:obj});${2}
    ```

#### DOM
- [ae] addEventListener
    ```
    ${1:document}.addEventListener('${2:event}', function (e) {
      ${3}
    });${4}
    ```

- [ac] appendChild
    ```
    ${1:document}.appendChild(${2:elem});${3}
    ```

- [rc] removeChild
    ```
    ${1:document}.removeChild(${2:elem});${3}
    ```

- [cel] createElement
    ```
    ${1:document}.createElement(${2:elem});${3}
    ```

- [gi] getElementById
    ```
    ${1:document}.getElementById('${2:id}');${3}
    ```

- [gc] getElementsByClassName
    ```
    ${1:document}.getElementsByClassName('${2:class}');${3}
    ```

- [gt] getElementsByTagName
    ```
    ${1:document}.getElementsByTagName('${2:tag}');${3}
    ```

- [qs] querySelector
    ```
    ${1:document}.querySelector('${2:selector}');${3}
    ```

- [qsa] querySelectorAll
    ```
    ${1:document}.querySelectorAll('${2:selector}');${3}
    ```

#### Loop
- [fe] forEach
    ```
    ${1:myArray}.forEach(function (${2:elem}) {
      ${3}
    });${4}
    ```

- [fi] for in
    ```
    for (${1:prop} in ${2:obj}) {
      if (${2:obj}.hasOwnProperty(${1:prop})) {
       ${3}
      }
    }${4}
    ```

#### Function
- [fn] function
    ```
    function ${1:methodName} (${2:arguments}) {
      ${3}
    }${4}
    ```

- [afn] anonymous function
    ```
    function (${1:arguments}) {
      ${2}
    };${3}
    ```

- [pr] prototype
    ```
    ${1:ClassName}.prototype.${2:methodName} = function (${3:arguments}) {
      ${4}
    };${5}
    ```

#### Timer
- [si] setInterval
    ```
    setInterval(function() {
      ${2}
    }, ${1:delay});${3}
    ```

- [st] setTimeout
    ```
    setTimeout(function() {
      ${2}
    }, ${1:delay});${3}
    ```

### Others
Please don't hesitate to contribute if you have any good snippets.

## Install
Search `Brackets Snippets (by edc)` in Brackets extension market, install then reload Brackets.

## How to add your own and edit the default snippets
Since the Manager UI is not finished, you have to find and edit the file which stores the snippets, here's steps:

1. Click Menu `Help` --> `Show Extensions Folder`
2. Open `/user/edc.brackets-snippets/hints.yml`, edit and save.
3. Reload Brackets

## Todo
1. Add Snippets Manager UI, allows user to edit snippets
2. Allow every snippet to have its description

## Credits
[JavaScript & NodeJS Snippets for Sublime Text 2/3](https://github.com/zenorocha/sublime-javascript-snippets)