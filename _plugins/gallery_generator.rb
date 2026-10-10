require "open3"

module Jekyll
  module Gallery
    GALLERY_DIR = "assets/photo-gallery"
    SIZES = [320, 640, 960, 1600].freeze
    THUMB_WIDTH = 400
    QUALITY = "82"
    THUMB_QUALITY = "75"

    module_function

    def magick
      @magick ||= if system("magick", "-version", out: File::NULL, err: File::NULL)
                    "magick"
                  else
                    "convert"
                  end
    end

    def identify_width(file)
      cmd = if magick == "magick"
              ["magick", "identify", "-format", "%w", file]
            else
              ["identify", "-format", "%w", file]
            end
      out, = Open3.capture2(*cmd)
      out.to_i
    end

    def originals(site)
      Dir.glob(File.join(site.source, GALLERY_DIR, "*", "*")).sort.select do |file|
        File.file?(file) && File.basename(file) =~ /\A\d+\.(jpe?g)\z/i
      end
    end

    def generate_derivative(file, dir, base, target_width, quality, suffix)
      out = File.join(dir, "#{base}-#{suffix}.jpg")
      return if File.exist?(out) && File.mtime(out) >= File.mtime(file)

      args = if magick == "magick"
               ["magick", file]
             else
               ["convert", file]
             end
      args += ["-auto-orient", "-strip", "-resize", "#{target_width}x>", "-quality", quality, out]
      system(*args, out: File::NULL, err: File::NULL)
    end

    def generate_derivatives(site)
      originals(site).each do |file|
        dir = File.dirname(file)
        base = File.basename(file, File.extname(file))
        width = identify_width(file)
        next if width <= 0

        generate_derivative(file, dir, base, THUMB_WIDTH, THUMB_QUALITY, "th")
        SIZES.each do |size|
          next if size >= width
          generate_derivative(file, dir, base, size, QUALITY, size.to_s)
        end
      end
    end
  end

  Jekyll::Hooks.register :site, :pre_read do |site|
    Gallery.generate_derivatives(site)
  end

  class GalleryGenerator < Generator
    safe true
    priority :normal

    def generate(site)
      galleries = site.config["galleries"] || []
      order = {}
      titles = {}
      galleries.each_with_index do |gallery, index|
        id = gallery["id"]
        order[id] = index
        titles[id] = {
          "pl" => gallery.dig("title", "pl") || id,
          "en" => gallery.dig("title", "en") || id,
        }
      end

      baseurl = site.config["baseurl"].to_s

      photos = Gallery.originals(site).map do |file|
        folder = File.basename(File.dirname(file))
        base = File.basename(file, File.extname(file))
        rel_dir = File.join("/", Gallery::GALLERY_DIR, folder)
        width = Gallery.identify_width(file)

        sizes = Gallery::SIZES.select { |size| size < width }
        srcset = sizes.map do |size|
          "#{baseurl}/assets/photo-gallery/#{folder}/#{base}-#{size}.jpg #{size}w"
        end.join(", ")
        full = if sizes.any?
                 File.join(rel_dir, "#{base}-#{sizes.last}.jpg")
               else
                 File.join(rel_dir, File.basename(file))
               end
        thumb = File.join(rel_dir, "#{base}-th.jpg")

        {
          "folder" => folder,
          "name" => base,
          "order" => order.fetch(folder, 999),
          "thumb" => thumb,
          "full" => full,
          "srcset" => srcset,
          "title_pl" => titles.dig(folder, "pl"),
          "title_en" => titles.dig(folder, "en"),
        }
      end

      photos.sort_by! { |photo| [photo["order"], photo["folder"], photo["name"]] }
      site.data["gallery"] = photos
    end
  end
end
