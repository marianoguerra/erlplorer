/*globals Viva, window, console, document, MODULES, EXAMPLE_OUTPUT, JsonHuman*/
(function () {
    'use strict';
    var MODULES_OBJ = {};

    (function () {
        var i, len, m = MODULES;
        for (i = 0, len = m.length; i < len; i += 1) {
            MODULES_OBJ[m[i]] = true;
        }
    }());

    function incr(obj, key, count) {
        if (obj[key] === undefined) {
            obj[key] = 0;
        }

        obj[key] += count;
    }

    function objToSortedList(obj) {
        var key, count, list = [];

        for (key in obj) {
            list.push([key, obj[key]]);
        }

        list.sort(function (a, b) {
            return b[1] - a[1];
        });

        return list;
    }

    function table(title, items, container) {
        var t = document.createElement('table'),
            titleNode = document.createElement('h2'),
            i, len, item, j, jlen, tr, td;

        for (i = 0, len = items.length; i < len; i += 1) {
            item = items[i];
            tr = document.createElement('tr');
            for (j = 0, jlen = item.length; j < jlen; j += 1) {
                td = document.createElement('td');
                td.innerHTML = "" + item[j];
                tr.appendChild(td);
            }

            t.appendChild(tr);
        }

        titleNode.innerHTML = title;
        container.appendChild(titleNode);
        container.appendChild(t);
    }

    function render(data, moduleFilter) {
        var graph = Viva.Graph.graph(),
            maxCount = 1,
            i, len, item, moduleName, refModuleName, refModules,
            funCalls, funName, funs,
            count, totalModuleCalls = {}, totalFunCalls = {},
            totalFunLength = {}, seenModules = [], noCallModules;

        document.getElementById('demo-section').style.display = "none";

        graph.addNode("ROOT", {name: "ROOT"});

        for (i = 0, len = data.length; i < len; i += 1) {
            item = data[i];
            if (item.status === "ok") {
                moduleName = item.module;
                seenModules.push(moduleName);
                graph.addNode(moduleName, {name: moduleName, info: item});
                graph.addLink(moduleName, "ROOT", {count: 1});

                refModules = item.data.modules;
                for (refModuleName in refModules) {
                    count = refModules[refModuleName];

                    if (!moduleFilter(refModuleName)) {
                        graph.addNode(refModuleName, {name: refModuleName});
                        graph.addLink(moduleName, refModuleName, {count: count});
                    }

                    maxCount = Math.max(maxCount, count);

                    incr(totalModuleCalls, refModuleName, count);
                }

                funs = item.data.functions;
                for (funName in funs) {
                    count = funs[funName].length;
                    incr(totalFunLength, moduleName + ":" + funName, count);
                }

                funCalls = item.data.external_funs;
                for (funName in funCalls) {
                    count = funCalls[funName];
                    incr(totalFunCalls, funName, count);
                }

            } else {
                console.error("Invalid module", item);
            }
        }

        var graphics = Viva.Graph.View.svgGraphics();

        graphics.node(function(node) {
            var textNode = Viva.Graph.svg('text'),
                name = node.data ? node.data.name : node.id;

            // it's one of the analyzed modules
            if (node.data.info) {
                textNode
                .attr('font-weight', 'bold')
                .attr('border', '1px solid #333')
                .attr('background-color', '#333');
            }
            return textNode.text(name)
            .attr('text-anchor', 'middle')
            .attr('cursor', 'pointer');
        });

        function countToStroke(count, max) {
            return (count / max) * 4;
        }

        graphics.link(function(link){
            return Viva.Graph.svg('path')
            .attr('stroke', '#333')
            .attr('stroke-width', countToStroke(link.data.count, maxCount));
        }).placeLink(function(linkUI, fromPos, toPos) {
            // linkUI - is the object returend from link() callback above.
            var data = 'M' + fromPos.x + ',' + fromPos.y +
                'L' + toPos.x + ',' + toPos.y;
            // 'Path data' (http://www.w3.org/TR/SVG/paths.html#DAttribute )
            // is a common way of rendering paths in SVG:
            linkUI.attr("d", data);
        });

        /*graphics.placeNode(function(nodeUI, pos) {
          console.log("place", nodeUI, pos);
          });*/

        var container = document.getElementById('graph'),
            renderer = Viva.Graph.View.renderer(graph, {
            graphics : graphics,
            container: container
        });

        container.style.display = "block";
        renderer.run();

        function isntStdlibModule(row) {
            return !MODULES_OBJ[row[0]];
        }

        function isntStdlibCall(row) {
            return !MODULES_OBJ[row[0].split(":")[0]];
        }

        noCallModules = seenModules.filter(function (name) {
            return totalModuleCalls[name] === undefined;
        });

        noCallModules.sort();

        noCallModules = noCallModules.map(function (name) {
            return [name];
        });

        if (noCallModules.length > 0) {
            table("Modules not Called", noCallModules, document.body);
        }

        table("Total Module Calls", objToSortedList(totalModuleCalls).filter(isntStdlibModule), document.body);
        table("Total Fun Calls", objToSortedList(totalFunCalls).filter(isntStdlibCall), document.body);
        table("Function Lengths", objToSortedList(totalFunLength), document.body);

        table("Total Module Calls (with Stdlib)", objToSortedList(totalModuleCalls), document.body);
        table("Total Fun Calls (with Stdlib)", objToSortedList(totalFunCalls), document.body);

        var node = JsonHuman.format(EXAMPLE_OUTPUT);
        var title = document.createElement('h2');
        title.innerHTML = "Raw Data";
        document.body.appendChild(title);
        document.body.appendChild(node);
    }


    function filterStdLibModules(name) {
        return !!MODULES_OBJ[name];
    }

    function onFileChange(event) {
        var file = event.target.files[0],
            reader = new window.FileReader();

        reader.onload = function(e) {
              render(JSON.parse(reader.result), filterStdLibModules);
        };

        reader.readAsText(file);
    }

    function main () {
        var dataFile = document.getElementById('data-file');

        dataFile.addEventListener('change', onFileChange);
        var node = JsonHuman.format(EXAMPLE_OUTPUT);
        document.getElementById('example-output').appendChild(node);
    }


    window.addEventListener('load', main);
}());
