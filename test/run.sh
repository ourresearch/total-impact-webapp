#!/bin/bash
#!/bin/bash
export NOSE_REDNOSE=1

while read e; do
  export $e
done < .env-local

nosy -c test/nosy.cfg