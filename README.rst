erlplorer
=========

Erlplorer is a script (escript) written in efene that analyzes your erlang
and/or efene modules and outputs JSON with information about them, you can use
that information to feed it to any tool you create.

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

Build
-----

You need `rebar3 <http://rebar3.org/>`_ installed somewhere in your $PATH for
this to build. The easiest way is::

    cd some/where/on/your/path
    wget https://s3.amazonaws.com/rebar3/rebar3
    chmod u+x rebar3

Otherwise follow `rebar3's getting started guide <http://www.rebar3.org/docs/getting-started>`_.

Then::

    make

The resulting escript will be at::

    _build/default/bin/erlplorer

You can copy the escript somewhere in your $PATH

Downloading
-----------

You can also download a pre compiled release from the `Releases Page <https://github.com/marianoguerra/erlplorer/releases/>`_, check the last one and download the erlplorer binary, you will still need Erlang installed to run it.

Run
---

::

    erlplorer info file1.erl [file2.fn ...]

Or::

    _build/default/bin/erlplorer info *.erl > myproject.json



License
-------

See LICENSE file
