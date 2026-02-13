package muzicc

default allow = true

deny[msg] if {
    contains(input.image, ":latest")
    msg := "Using latest tag is not allowed"
}

deny[msg] if {
    not contains(input.image, ":")
    msg := "Image must have a tag"
}

allow if {
    count(deny) == 0
}
