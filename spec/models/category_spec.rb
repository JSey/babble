require "spec_helper"

path = "./plugins/babble/plugin.rb"
source = File.read(path)
plugin = Plugin::Instance.new(Plugin::Metadata.parse(source), path)
plugin.activate!
plugin.initializers.first.call

describe ::Babble::Category do

  before do
    SiteSetting.load_settings(File.join(Rails.root, 'plugins', 'babble', 'config', 'settings.yml'))
  end

  describe "find_or_create" do

    it "creates a new category" do
      expect { Babble::Category.find_or_create }.to change { Category.count }.by(1)
      category = Category.last
      expect(category.name).to eq SiteSetting.babble_category_name
      expect(category.user).to eq Babble::User.find_or_create
    end

    it "does not create duplicate categories" do
      Babble::Category.find_or_create
      expect { Babble::Category.find_or_create }.not_to change { Category.count }
    end
  end
end
