erlplorer
=========

erlplorer search
----------------

A command line tool to search Erlang and efene code by providing expressions
with "holes". To search by structure, not by text.

What I mean by "by structure"?

You may want to search for stuff like:

* Calls to function f1 on module m1 with 3 arguments

  + Same but where some argument has a specific value

* Tuples with a specific number of items where the first item is a given atom

I guess you get the idea, you want to match some expression's structure, but not
the text, because of formatting, new lines, spacing and also because some of the
values are not important, you would like to match any expression in some
places.

Examples
........

.. code-block:: sh

    erlplorer search "{{_@0, _@1, _@2}}" **/src/*.erl

::

    asn1/src/asn1ct.erl:1366 {{decode,{Module,Type,Value},Error}}
    dialyzer/src/dialyzer_plt.erl:675 {{M,_F,_A}}
    kernel/src/pg2.erl:300 {{local_member,Name,Pid}}
    kernel/src/pg2.erl:302 {{pid,Pid,Name}}
    ...

The first argument `"{{_@0, _@1, _@2}}"` is an Erlang expression, in this case
a one item tuple holding a 3 item tuple, the weird looking variables are a
specially named variables that erlplorer interprets as "match any AST node
here, I don't care", they start with `_@`, any other variable will match that variable name in the code.

We can see that by searching for places that match a 3 item tuple ignoring the 3 places:

.. code-block:: sh

    erlplorer search "{_, _, _}" **/src/*.erl

::

    asn1/src/asn1ct_check.erl:917 {_,_,_}
    ... to many results to show

We can use this "meta variables" to do more pattern matching, let's search
for 3 item tuples that have the same thing in the 3 places:

.. code-block:: sh

    erlplorer search "{_@, _@, _@}" **/src/*.erl

::

    asn1/src/asn1ct_check.erl:917 {_,_,_}
    ...
    asn1/src/asn1ct_constructed_ber_bin_v2.erl:701 {[],[],[]}
    ...
    asn1/src/asn1ct_constructed_per.erl:401 {false,false,false}
    ...
    common_test/src/ct_framework.erl:1130 {_,_,_}
    ...
    common_test/src/ct_logs.erl:1492 {"","",""}
    ...

Or search for identity functions:

.. code-block:: sh

    erlplorer search "fun(_@) -> _@ end" **/src/*.erl

::

	asn1/src/asn1ct.erl:2099 fun(D) -> D end
	asn1/src/asn1ct_gen_ber_bin_v2.erl:650 fun(V) -> V end
	common_test/src/test_server.erl:2067 fun(T) -> T end
	compiler/src/beam_a.erl:147 fun(L) -> L end
	compiler/src/beam_jump.erl:289 fun(Old) -> Old end
	...

Places that add 0 to something:

.. code-block:: sh

    erlplorer search "_@ + 0" **/src/*.erl

::

	asn1/src/asn1rtt_per_common.erl:187 N + 0
	asn1/src/asn1rtt_per_common.erl:197 N + 0
	stdlib/src/ms_transform.erl:90 16 + 0
	stdlib/src/ms_transform.erl:92 17 + 0
	stdlib/src/ms_transform.erl:97 22 + 0
	stdlib/src/ms_transform.erl:102 18 + 0
	stdlib/src/ms_transform.erl:106 23 + 0
	stdlib/src/ms_transform.erl:111 24 + 0
	stdlib/src/ms_transform.erl:167 20 + 0
	stdlib/src/ms_transform.erl:170 19 + 0
	stdlib/src/ms_transform.erl:174 21 + 0

Places that add the same thing:

.. code-block:: sh

    erlplorer search "_@ + _@" **/src/*.erl

::

	dialyzer/test/small_SUITE_data/src/maps_redef2.erl:18 A + A
	stdlib/src/dets_utils.erl:1138 1 + 1
	stdlib/src/dets_utils.erl:1226 1 + 1
	stdlib/src/rand.erl:1464 Y + Y
	stdlib/src/zip.erl:1315 Sz + Sz

You get the idea...

How to use it
.............

You need Erlang and rebar3 installed and in your `$PATH`

.. code-block:: sh

	git clone https://github.com/marianoguerra/erlplorer
	cd erlplorer
	rebar3 escriptize
	# ~/bin or any other folder in your $PATH
	cp _build/default/bin/erlplorer ~/bin

Emacs integration
.................

Check `facundoolano emacs integration <https://github.com/facundoolano/emacs.d/blob/590a01d1bd75af4a5e4e08971900c6dece20b5e4/modules/facundo-erlang.el#L66-L94>`_

How is it implemented?
......................

Wrap the expression passed in a function [1]_

Compile the module to Erlang AST [2]_

Extract the AST body of the dummy function [3]_

"abstract the AST", that is, I take an AST as Erlang data and I generate an
AST that when compiled will generate that Erlang AST, I need that because I
will put that AST in a pattern match position to pattern match AST nodes as I
walk Erlang ASTs [4]_. yeah, meta and too many AST references

An example is worth many of my words:

.. code-block:: erlang

	% the 42 is a fake "line" where the code was supposedly parsed
	1> erl_parse:abstract({foo, 100, "hi"}, 42).
	{tuple,42,[{atom,42,foo},{integer,42,100},{string,42,"hi"}]}

We have to take care of two things:

* vars must match an AST node for a var with that name, not act as vars that will be bound on first match and pattern matched on successive matches
* vars that start with _@ will be compiled to actual vars that behave as vars in a pattern match, that's how we can use them to pattern match

Then compile the abstracted AST into a module with a function we can pass to `ast_walk/3` [5]_

Load the compiled module [6]_

Parse the files passed as last argument [7]_

And walk the parsed AST with our compiled matcher [8]_

For each match, since we have the AST, try to pretty print it [9]_

Give it a try and let me know what you think.

PS: the code is a hack I did to use it when I needed it, don't judge efene by the
code you see on that project :P

.. [1] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L53

.. [2] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L56

.. [3] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L57

.. [4] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L58

.. [5] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L64

.. [6] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L13

.. [7] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L152

.. [8] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L156

.. [9] https://github.com/marianoguerra/erlplorer/blob/0bdd56057dfeb399b9961ae6322f74ccabc2cc5a/src/erlplorer.fn#L76

erlplorer info
--------------

Analyzes your erlang and/or efene modules and outputs JSON with information
about them, you can use that information to feed it to any tool you create.

Information the tool exports:

* Module name
* Modules referenced by current module with number of references
* External functions called by current module with number of calls
* Declared functions, location, number of lines, number of clauses
* Variable names and lines per function
* Record names and lines per function
* Function call names and lines per function
* Number of clauses (branches) in functions

The tool can easily be extended to record more statistics.

Run
---

::

    erlplorer info file1.erl [file2.fn ...]

Or::

    _build/default/bin/erlplorer info *.erl > myproject.json

License
-------

See LICENSE file
