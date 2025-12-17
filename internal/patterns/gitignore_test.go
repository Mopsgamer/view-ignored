package patterns

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGitignoreMatch(t *testing.T) {
	assert := assert.New(t)

	assert.True(GitignoreMatch(".git", ".git/message"))
	assert.False(GitignoreMatch(".git", ".github/message"))

	assert.True(GitignoreMatch("node_modules", "node_modules/x/message.ts"))
	assert.True(GitignoreMatch("message", ".git/message"))

	assert.True(GitignoreMatch("**/.git", ".git/message"))
	assert.False(GitignoreMatch("**/.git", ".github/message"))

	assert.True(GitignoreMatch("/.git", ".git/message"))
	assert.False(GitignoreMatch("/.git", ".github/message"))

	assert.False(GitignoreMatch("/message", ".git/message"))
	assert.False(GitignoreMatch("/message", ".git/message/file"))
	assert.True(GitignoreMatch("/message", "message"))
	assert.True(GitignoreMatch("/message", "message/file"))

	assert.True(GitignoreMatch(".git/", ".git/message"))
	assert.True(GitignoreMatch(".git/", ".git/message/file"))
	assert.True(GitignoreMatch(".git/", ".git"))
	assert.False(GitignoreMatch(".git/", ".github/message"))
	assert.False(GitignoreMatch(".git/", ".github/message/file"))
	assert.False(GitignoreMatch(".git/", ".github"))
}
