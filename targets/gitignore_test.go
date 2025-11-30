package targets

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestGitignoreMatch(t *testing.T) {
	assert := assert.New(t)
	matched := false

	matched, _ = GitignoreMatch(".git", ".git/message")
	assert.True(matched)

	matched, _ = GitignoreMatch("node_modules", "node_modules/x/message.ts")
	assert.True(matched)

	matched, _ = GitignoreMatch("**/.git", ".git/message")
	assert.True(matched)

	matched, _ = GitignoreMatch("/.git", ".git/message")
	assert.True(matched)

	matched, _ = GitignoreMatch("message", ".git/message")
	assert.True(matched)

	matched, _ = GitignoreMatch("/message", ".git/message")
	assert.False(matched)
}
