
# Overwrite the default `highlight` tags to use a custom markup.
module Bez
  class HighlightBlock < Liquid::Block
  include Jekyll::Filters
    def initialize(tag_name, language, tokens)
      super
      language = language.split
      @language = language[0]
      @filename = language.length > 1 ? language[1] : nil
    end

    def is_terminal?()
      return ['bash', 'zsh'].include? @language
    end

    def render(context)
      content = super.strip
      content = xml_escape(content)
      if @language == 'text'
        <<-HIGHLIGHT
<pre class="highlight language-#{@language}"><code class="language-#{@language}">#{content}</code></pre>
        HIGHLIGHT
      elsif is_terminal?
        <<-TERMINAL
  <div class="grid-container">
    <div class="terminal">
      <div class="icons"><span></span></div>
      <div class="title">#{@filename ? @filename : '&nbsp;'}</div>
      <pre><code class="language-#{@language}">#{content}</code></pre>
    </div>
  </div>
        TERMINAL
      else
        <<-CODE
<div class="code-section">
  <div class="filename">
    <div class="row">
      #{@filename}
    </div>
  </div>
  <div class="row">
    <div class="large-12 columns">
      <pre><code class="language-#{@language}">#{content}</code></pre>
    </div>
  </div>
</div>
        CODE
      end
    end
  end
end

Liquid::Template.register_tag('highlight', Bez::HighlightBlock)
