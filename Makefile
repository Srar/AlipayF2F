MOCHA=./node_modules/.bin/mocha
DIR=test

all: test
	
test:
	$(MOCHA) test
		    
.PHONY : test