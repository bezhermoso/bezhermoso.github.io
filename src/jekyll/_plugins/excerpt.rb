module Excerpt
  def excerpt(input)
    input.split('<!--stop-->').first.strip
  end
end

Liquid::Template.register_filter(Excerpt)
