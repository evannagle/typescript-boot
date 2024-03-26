
SCRIPTS_PATH			= scripts
ESBUILD_CONFIG_PATH		= $(SCRIPTS_PATH)/esbuild.config.js
APP_BIN_PATH			= dist/app.js
EPHEMERAL_PATHS			= dist coverage docs/graph.png
PYTHON_BIN_PATH			= /usr/bin/python3
DOCS_PATH				= docs
GRAPH_PNG_PATH		 	= $(DOCS_PATH)/graph.png

define title
	@echo "\n\033[1;33m🤖$(1)\033[0m"
endef

.PHONY: %

huh:
# Get the name of the command
# Print the command, followed by the comments below it, like this one!
	$(PYTHON_BIN_PATH) scripts/makefile-json.py Makefile

clean:
# Clean up ephemeral paths
	$(call title, "Cleaning up ephemeral paths: $(EPHEMERAL_PATHS)")
	rm -rf $(EPHEMERAL_PATHS)

build:
# Build the app, dump into the dist folder
	$(call title, "Building the app: $(APP_BIN_PATH)")
	node $(ESBUILD_CONFIG_PATH) production

app: clean build
# Rebuild the app, then run it to get the output
# A quick way to see the output of the app, and to sanity check the build 
	$(call title, "Running the app: $(APP_BIN_PATH)")
	@node $(APP_BIN_PATH) | sed 's/^/> /'

test:
# Run the jest unit tests
	$(call title, "Running tests")
	npm exec jest

test-coverage: clean
# Run the jest unit tests with coverage enabled
# Then open the coverage report in the browser
	$(call title, "Running tests with coverage")
	npm exec jest tests --coverage
	open coverage/index.html

docs:
# Generate the documentation for the project
	$(call title, "Generating documentation")
	npx typedoc --plugin typedoc-plugin-markdown --out $(DOCS_PATH) src/index.ts

format:
# Format the code using prettier
	$(call title, "Formatting code")
	npx prettier --write src/**/*.ts

install-husky:
# Install husky if it's not already installed
	$(call title, "Installing husky if needed")
	@npm install --save-dev husky
	npx husky init

install-madge:
# Install madge if it's not already installed
	$(call title, "Installing madge if needed")
	@npm list -g madge || npm install --location=global madge

lint: format
# Lint the code using eslint
	$(call title, "Linting code")
	npx eslint src/**/*.ts

lint-fix: format
# Lint the code using eslint, and fix the issues
	$(call title, "Linting code and fixing issues")
	npx eslint src/**/*.ts --fix

pre-commit: lint-fix test
# Run the pre-commit checks
	$(call title, "Running pre-commit checks")

visualize-circular-dependencies: 
# Visualize the circular dependencies in the project
	$(call title, "Visualizing circular dependencies")
	@madge --circular --extensions ts src

visualize-dependencies:
# Visualize the dependencies in the project
	$(call title, "Visualizing dependencies")
	@madge --extensions ts src

visualize-dependencies-graph:
# Visualize the dependencies in the project as a graph
	$(call title, "Visualizing dependencies as a graph")
	mkdir -p $$(dirname $(GRAPH_PNG_PATH))
	@madge --extensions ts src --image $(GRAPH_PNG_PATH)
	open $(GRAPH_PNG_PATH)

changelog:
# Generate the changelog for the project
	$(call title, "Generating changelog")
	npx auto-changelog -p -o CHANGELOG.md --hide-credit --release-summary --hide-empty-releases --sort-commits date-desc && git add CHANGELOG.md
