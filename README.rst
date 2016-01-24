erlplorer
=========

Explore Erlang and Efene Source Code

Build
-----

::

    make

The resulting escript will be at::

    _build/default/bin/erlplorer

There's a symlink to it in this repo, but you can copy the escript somewhere in
your $PATH

Run
---

::

    erlplorer info file1.erl [file2.fn ...]

Or::

    _build/default/bin/erlplorer info *.erl > myproject.json



License
-------

See LICENSE file
