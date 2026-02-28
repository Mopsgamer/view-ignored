package patterns

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGitignoreMatch(t *testing.T) {
	assert := assert.New(t)

	assert.True(StringCompile(".git", ".git/message"))
	assert.False(StringCompile(".git", ".github/message"))

	assert.True(StringCompile("node_modules", "node_modules/x/message.ts"))
	assert.True(StringCompile("message", ".git/message"))

	assert.True(StringCompile("**/.git", ".git/message"))
	assert.False(StringCompile("**/.git", ".github/message"))

	assert.True(StringCompile("/.git", ".git/message"))
	assert.False(StringCompile("/.git", ".github/message"))

	assert.False(StringCompile("/message", ".git/message"))
	assert.False(StringCompile("/message", ".git/message/file"))
	assert.True(StringCompile("/message", "message"))
	assert.True(StringCompile("/message", "message/file"))

	assert.True(StringCompile(".git/", ".git/message"))
	assert.True(StringCompile(".git/", ".git/message/file"))
	assert.True(StringCompile(".git/", ".git"))
	assert.False(StringCompile(".git/", ".github/message"))
	assert.False(StringCompile(".git/", ".github/message/file"))
	assert.False(StringCompile(".git/", ".github"))
}
