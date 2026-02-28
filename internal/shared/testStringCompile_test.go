package shared

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func stringCompile(pattern string) PatternMinimatch {
	return StringCompile(pattern, []string{}, StringCompileOptions{NoCase: false})
}

func TestStringCompile(t *testing.T) {
	assert := assert.New(t)

	assert.True(stringCompile(".git").Test(".git/message"))
	assert.False(stringCompile(".git").Test(".github/message"))

	assert.True(stringCompile("node_modules").Test("node_modules/x/message.ts"))
	assert.True(stringCompile("message").Test(".git/message"))

	assert.True(stringCompile("**/.git").Test(".git/message"))
	assert.False(stringCompile("**/.git").Test(".github/message"))

	assert.True(stringCompile("/.git").Test(".git/message"))
	assert.False(stringCompile("/.git").Test(".github/message"))

	assert.False(stringCompile("/message").Test(".git/message"))
	assert.False(stringCompile("/message").Test(".git/message/file"))
	assert.True(stringCompile("/message").Test("message"))
	assert.True(stringCompile("/message").Test("message/file"))

	assert.True(stringCompile(".git/").Test(".git/message"))
	assert.True(stringCompile(".git/").Test(".git/message/file"))
	assert.True(stringCompile(".git/").Test(".git"))
	assert.False(stringCompile(".git/").Test(".github/message"))
	assert.False(stringCompile(".git/").Test(".github/message/file"))
	assert.False(stringCompile(".git/").Test(".github"))
}
